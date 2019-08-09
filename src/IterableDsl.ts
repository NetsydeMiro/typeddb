import { Direction, Exclusions, Range } from './common'
import { IterableStore, IterateParams, Iterator } from './IterableStore'

/*
Iterator DSL

store.iterate().ascending(iterator)
store.iterate(10).ascending(iterator)
store.iterate().skip(20).ascending(iterator)
store.iterate().over('propName').ascending(iterator)
store.iterate().greaterThanOrEqualTo(val).ascending(iterator)

store.iterate(10).skip(20).over('propName').between(lower, upper, exclusions).descending(iterator)
*/

class DslDirection<TEntity> {
    constructor(protected store: IterableStore<TEntity, any, any>, protected params: IterateParams<TEntity, any>) { }

    private doIterate(direction: Direction, iterator: Iterator<TEntity>) {
        let builtParams: IterateParams<TEntity, any> = { ...this.params, direction }
        return this.store.doIterate(builtParams, iterator)
    }

    ascending = (iterator: Iterator<TEntity>) => this.doIterate('ascending', iterator)

    descending = (iterator: Iterator<TEntity>) => this.doIterate('descending', iterator)
}

class DslBoundary<TEntity, TIndices extends keyof TEntity> extends DslDirection<TEntity> {

    constructor(store: IterableStore<TEntity, any, any>, params: IterateParams<TEntity, any>) {
        super(store, params)
    }

    equaling(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.equalTo<TEntity[TIndices]>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    greaterThan(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.greaterThan<TEntity[TIndices]>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    greaterThanOrEqualTo(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.greaterThanOrEqualTo<TEntity[TIndices]>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    lessThan(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.lessThan<TEntity[TIndices]>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    lessThanOrEqualTo(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.lessThanOrEqualTo<TEntity[TIndices]>(val) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    between(min: TEntity[TIndices], max: TEntity[TIndices], exclusions?: Exclusions): DslDirection<TEntity> {
        let range = Range.between<TEntity[TIndices]>(min, max, exclusions) as any
        let builtParams: IterateParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }
}

class DslOver<TEntity, TIndices extends keyof TEntity> extends DslBoundary<TEntity, TIndices> {
    constructor(store: IterableStore<TEntity, any, any>, params: IterateParams<TEntity, any>) { super(store, params) }

    over(index: TIndices): DslBoundary<TEntity, TIndices> {
        let builtParams: IterateParams<TEntity, TIndices> = { ...this.params, index }
        return new DslBoundary(this.store, builtParams)
    }
}

export class DslSkip<TEntity, TIndices extends keyof TEntity> extends DslOver<TEntity, TIndices> {
    constructor(store: IterableStore<TEntity, any, any>, params: IterateParams<TEntity, any>) { super(store, params) }

    skip(num: number): DslOver<TEntity, TIndices> {
        let builtParams: IterateParams<TEntity, any> = { ...this.params, skip: num }
        return new DslOver(this.store, builtParams)

    }
}
