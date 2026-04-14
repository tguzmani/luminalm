export class EntryResponseDto {
  id!: string;
  title!: string;
  createdAt!: Date;
  updatedAt!: Date;
  collectionId!: string | null;
}

export class EntryDetailDto extends EntryResponseDto {
  content!: string;
}
