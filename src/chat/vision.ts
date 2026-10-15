import { promises as fs } from 'fs';
import { Message } from 'oceanic.js';
import path from 'path';

import { resolveSafePath } from '../tools/coding/files';

export interface VisionImage {
    dataUrl: string;
    originalUrl: string;
    contentType?: string;
}

const IMAGE_EXT_REGEX = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;

export function isImageAttachment(att: { contentType?: string; filename?: string; url?: string }): boolean {
    if (att.contentType && att.contentType.toLowerCase().startsWith('image/')) {
        return true;
    }
    const target = (att.filename || att.url || '').toLowerCase().split('?')[0];
    return IMAGE_EXT_REGEX.test(target);
}

export function extractImageUrlsFromText(text: string): string[] {
    if (!text) return [];
    const urls: string[] = [];
    const urlRegex = /https?:\/\/[^\s<>"'`]+/gi;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(text)) !== null) {
        let rawUrl = match[0];
        rawUrl = rawUrl.replace(/[.,)\]>]+$/, '');

        const cleanLower = rawUrl.toLowerCase().split('?')[0];
        const isImageExt = IMAGE_EXT_REGEX.test(cleanLower);
        const isDiscordAttachment = /^https?:\/\/(?:cdn|media)\.discordapp\.(?:com|net)\/attachments\//i.test(rawUrl);
        const isDiscordMedia = /^https?:\/\/(?:cdn|media)\.discordapp\.(?:com|net)\/(?:embed\/avatars|avatars|icons|app-icons)\//i.test(rawUrl);

        if (isImageExt || isDiscordAttachment || isDiscordMedia) {
            if (!urls.includes(rawUrl)) {
                urls.push(rawUrl);
            }
        }
    }

    return urls;
}

export async function fetchImageAsDataUrl(url: string): Promise<VisionImage> {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 DiscordBot/1.0'
            },
            signal: AbortSignal.timeout(15000)
        });

        if (!res.ok) {
            return { dataUrl: url, originalUrl: url };
        }

        const rawContentType = res.headers.get('content-type') || '';
        let mime = rawContentType.split(';')[0].trim().toLowerCase();

        if (!mime.startsWith('image/')) {
            const extMatch = url.toLowerCase().split('?')[0].match(IMAGE_EXT_REGEX);
            if (extMatch) {
                const ext = extMatch[1] === 'jpg' ? 'jpeg' : extMatch[1];
                mime = `image/${ext}`;
            } else {
                mime = 'image/jpeg';
            }
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Keep payloads manageable (<= 15MB base64)
        if (buffer.length > 15 * 1024 * 1024) {
            return { dataUrl: url, originalUrl: url, contentType: mime };
        }

        const base64 = buffer.toString('base64');
        return {
            dataUrl: `data:${mime};base64,${base64}`,
            originalUrl: url,
            contentType: mime
        };
    } catch (err) {
        console.warn(`[Vision] Failed to fetch image ${url} as dataUrl, falling back to direct URL:`, err);
        return { dataUrl: url, originalUrl: url };
    }
}

export async function extractImagesFromMessage(message: Message, refMessage?: Message | null): Promise<VisionImage[]> {
    const candidateUrls: string[] = [];

    // 1. Direct attachments from the message
    if (message.attachments && message.attachments.size > 0) {
        for (const att of message.attachments.values()) {
            if (isImageAttachment(att)) {
                candidateUrls.push(att.url);
            }
        }
    }

    // 2. URLs inside the message text
    const textUrls = extractImageUrlsFromText(message.content);
    for (const url of textUrls) {
        if (!candidateUrls.includes(url)) {
            candidateUrls.push(url);
        }
    }

    // 3. Fallback: if no image in current message, check referenced message
    if (candidateUrls.length === 0 && refMessage) {
        if (refMessage.attachments && refMessage.attachments.size > 0) {
            for (const att of refMessage.attachments.values()) {
                if (isImageAttachment(att)) {
                    candidateUrls.push(att.url);
                }
            }
        }
        const refTextUrls = extractImageUrlsFromText(refMessage.content);
        for (const url of refTextUrls) {
            if (!candidateUrls.includes(url)) {
                candidateUrls.push(url);
            }
        }
    }

    const limitedUrls = candidateUrls.slice(0, 5);
    const visionImages: VisionImage[] = [];

    for (const url of limitedUrls) {
        const prepared = await fetchImageAsDataUrl(url);
        visionImages.push(prepared);
    }

    return visionImages;
}

export async function inspectImage(urlOrPath: string, instruction?: string): Promise<{ success: boolean; message: string; analysis?: string }> {
    const apiBase = (process.env.AI_API_BASE || 'http://localhost:20128/v1').replace(/\/+$/, '');
    const apiKey = process.env.AI_API_KEY || '';
    const model = process.env.AI_MODEL || 'ag/gemini-3.8-flash-low';

    let dataUrl = '';

    try {
        if (/^https?:\/\//i.test(urlOrPath)) {
            const prepared = await fetchImageAsDataUrl(urlOrPath);
            dataUrl = prepared.dataUrl;
        } else {
            const resolved = resolveSafePath(urlOrPath);
            const ext = path.extname(resolved).slice(1).toLowerCase();
            const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext || 'png'}`;
            const fileBuf = await fs.readFile(resolved);
            dataUrl = `data:${mime};base64,${fileBuf.toString('base64')}`;
        }

        const promptText = instruction && instruction.trim()
            ? `Tolong analisis gambar ini sesuai instruksi: ${instruction.trim()}`
            : 'Tolong baca semua teks (OCR), data tabel, error kodingan, atau detail visual penting yang ada pada gambar ini secara lengkap, jelas, dan akurat.';

        const response = await fetch(`${apiBase}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: promptText },
                            { type: 'image_url', image_url: { url: dataUrl } }
                        ]
                    }
                ],
                stream: false
            }),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            const errText = await response.text();
            return {
                success: false,
                message: `Gagal menganalisis gambar: API status ${response.status} (${errText.slice(0, 200)})`
            };
        }

        const raw = await response.text();
        let analysis = '';

        try {
            const data = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
            analysis = data.choices?.[0]?.message?.content?.trim() || '';
        } catch {
            const lines = raw.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                    try {
                        const chunk = JSON.parse(trimmed.slice(6)) as {
                            choices?: { delta?: { content?: string }; message?: { content?: string } }[];
                        };
                        const chunkContent = chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.message?.content;
                        if (chunkContent) analysis += chunkContent;
                    } catch {
                        // ignore chunk error
                    }
                }
            }
            analysis = analysis.trim();
        }

        if (!analysis) {
            return {
                success: false,
                message: 'Model vision tidak mengembalikan hasil analisis gambar.'
            };
        }

        return {
            success: true,
            message: 'Gambar berhasil dibaca dan dianalisis.',
            analysis
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            message: `Terjadi kesalahan saat membaca gambar: ${errorMsg}`
        };
    }
}
