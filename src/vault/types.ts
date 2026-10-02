export interface VaultFileNode {
    type: 'file';
    content: string;
    createdAt: number;
    updatedAt: number;
    sharedWith?: string[];
}

export interface VaultDirNode {
    type: 'dir';
    createdAt: number;
    updatedAt: number;
}

export type VaultNode = VaultFileNode | VaultDirNode;

export interface UserVault {
    userId: string;
    username: string;
    createdAt: number;
    nodes: Record<string, VaultNode>;
}

export interface SharedRef {
    ownerId: string;
    ownerName: string;
    path: string;
    sharedAt: number;
}

export interface VaultDb {
    allowedUsers: string[];
    users: Record<string, UserVault>;
    shares?: Record<string, SharedRef[]>;
}

export interface DirEntry {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size: number;
    updatedAt: number;
}
