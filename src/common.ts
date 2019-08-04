export type Direction = "ascending" | "descending"

export interface EntityClass<TEntity> {
    new(): TEntity
}
