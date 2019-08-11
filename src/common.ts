export type Direction = "ascending" | "descending"

export function toIDBDirection(direction: Direction): IDBCursorDirection {
    switch(direction) {
        case "ascending": return "next"
        case "descending": return "prev"
    }
}

export interface EntityClass<TEntity> {
    new(): TEntity
}

export interface GetParams<TEntity, TIndices extends keyof TEntity> {
    index?: TIndices
    count?: number
    range?: Range<TEntity[TIndices]>
    direction?: Direction
}

export interface SelectionParams<TEntity, TIndices extends keyof TEntity> extends GetParams<TEntity, TIndices> {
    skip?: number
}

export interface Exclusions {
    excludeMin?: boolean
    excludeMax?: boolean
}

export class Range<T> {
    constructor(public toIDBRange: { (): IDBKeyRange }) { }

    static all() : Range<any> {
        return new Range(
            () => null
        )
    }

    static equalTo<T>(val: T) : Range<T> {
        return new Range<T>(
            () => IDBKeyRange.only(val)
        )
    }

    static greaterThan<T>(min: T): Range<T> {
        return new Range<T>(
            () => IDBKeyRange.lowerBound(min, true)

        )
    }

    static greaterThanOrEqualTo<T>(min: T): Range<T> {
        return new Range<T>(
            () => IDBKeyRange.lowerBound(min)

        )
    }

    static lessThan<T>(max: T): Range<T> {
        return new Range<T>(
            () => IDBKeyRange.upperBound(max, true)
        )
    }

    static lessThanOrEqualTo<T>(max: T): Range<T> {
        return new Range<T>(
            () => IDBKeyRange.upperBound(max)
        )
    }

    static between<T>(min: T, max: T, exclusions?: Exclusions): Range<T> {
        return new Range<T>(
            () => IDBKeyRange.bound(
                min,
                max,
                exclusions && exclusions.excludeMin,
                exclusions && exclusions.excludeMax)
        )
    }
}