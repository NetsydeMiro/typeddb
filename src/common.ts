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

export abstract class Range<T> {
    constructor(protected point1: T, protected point2?: T) {}

    abstract toIDBRange(): IDBKeyRange
}

export class All extends Range<any> {
    constructor() { super(null) }

    toIDBRange(): IDBKeyRange {
        return null
    }
}

export class EqualTo<T> extends Range<T> {
    constructor(val: T) { super(val) }

    toIDBRange(): IDBKeyRange {
        return IDBKeyRange.only(this.point1)
    }
}

export class GreaterThan<T> extends Range<T> {
    constructor(min: T) { super(min) }

    toIDBRange(): IDBKeyRange {
        return IDBKeyRange.lowerBound(this.point1, true)
    }
}

export class GreaterThanOrEqual<T> extends Range<T> {
    constructor(min: T) { super(min) }

    toIDBRange(): IDBKeyRange {
        return IDBKeyRange.lowerBound(this.point1)
    }
}

export class LessThan<T> extends Range<T> {
    constructor(max: T) { super(max)}

    toIDBRange(): IDBKeyRange {
        return IDBKeyRange.upperBound(this.point1, true)
    }
}

export class LessThanOrEqual<T> extends Range<T> {
    constructor(max: T) { super(max)}

    toIDBRange(): IDBKeyRange {
        return IDBKeyRange.upperBound(this.point1)
    }
}

export interface Exclusions {
    excludeMin?: boolean
    excludeMax?: boolean
}

export class Between<T> extends Range<T> {
    constructor(min: T, max: T, private exclusions?: Exclusions) { 
        super(min, max) 
    }

    toIDBRange(): IDBKeyRange {
        return IDBKeyRange.bound(
            this.point1, 
            this.point2, 
            this.exclusions && this.exclusions.excludeMin, 
            this.exclusions && this.exclusions.excludeMax)
    }
}