export interface IPacker {
    id: number;
    first_name: string;
    last_name: string;
    weight_amount: number;
    created_at: Date;
    updated_at: Date;
}

export interface IPackerHistory {
    id: number;
    packer_id: number;
    packed_weight: number;
    packed_items_count: number;
    good_id?: number;
    notes?: string;
    created_at: Date;
    packer?: IPacker;
}

export interface IPackerStatistics {
    packerId: number;
    firstName: string;
    lastName: string;
    totalPackings: number;
    totalWeight: number;
    totalItems: number;
}

export interface ITopPacker extends IPackerStatistics {
    periodWeight: number;
    periodItems: number;
}

export interface IAddPackingHistoryDto {
    packerId: number;
    packedWeight: number;
    packedItemsCount: number;
    goodId?: number;
    notes?: string;
} 