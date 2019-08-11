import { Direction, Exclusions, Range, SelectionParams } from './common'
import { QueryableStore } from './QueryableStore'

/*
Query Builder DSL
store.select().ascending()
store.select(10).ascending()
store.select().skip(20).ascending()
store.select().having('propName').ascending()
store.select().having('propName').greaterThanOrEqualTo(val).descending()
store.select(10).skip(20).having('propName').between(lower, upper, exclusions).ascending()

Query Builder DSL 2
store
    .take(10)
    .skip(20)

    .over('propName', Range.greaterThan(val), 'descending')
    .over.propName.greaterThan(val).descending

    .having('propName', Range.greaterThan(val), 'descending')
    .having.propName.greaterThan(val).descending

    .select(ent => 'map')
    .iterate(ent => 'iterate')
*/

class DslDirection<TEntity> {
    constructor(protected store: QueryableStore<TEntity, any, any>, protected params: SelectionParams<TEntity, any>) { }

    private doSelect(direction: Direction) {
        let builtParams: SelectionParams<TEntity, any> = { ...this.params, direction }
        return this.store.doSelect(builtParams)
    }

    ascending(): Promise<Array<TEntity>> {
        return this.doSelect("ascending")
    }

    descending(): Promise<Array<TEntity>> {
        return this.doSelect("descending")
    }
}

class DslBoundary<TEntity, TIndices extends keyof TEntity> extends DslDirection<TEntity> {
    constructor(store: QueryableStore<TEntity, any, any>, params: SelectionParams<TEntity, any>) { 
        super(store, params) 
    }

    equaling(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.equalTo<TEntity[TIndices]>(val) as any
        let builtParams: SelectionParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    greaterThan(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.greaterThan<TEntity[TIndices]>(val) as any
        let builtParams: SelectionParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    greaterThanOrEqualTo(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.greaterThanOrEqualTo<TEntity[TIndices]>(val) as any
        let builtParams: SelectionParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    lessThan(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.lessThan<TEntity[TIndices]>(val) as any
        let builtParams: SelectionParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    lessThanOrEqualTo(val: TEntity[TIndices]): DslDirection<TEntity> {
        let range = Range.lessThanOrEqualTo<TEntity[TIndices]>(val) as any
        let builtParams: SelectionParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }

    between(min: TEntity[TIndices], max: TEntity[TIndices], exclusions?: Exclusions): DslDirection<TEntity> {
        let range = Range.between<TEntity[TIndices]>(min, max, exclusions) as any
        let builtParams: SelectionParams<TEntity, any> = { ...this.params, range }
        return new DslDirection(this.store, builtParams)
    }
}

class DslHaving<TEntity, TIndices extends keyof TEntity> extends DslBoundary<TEntity, TIndices> {
    constructor(store: QueryableStore<TEntity, any, any>, params: SelectionParams<TEntity, any>) { super(store, params) }

    having(index: TIndices): DslBoundary<TEntity, TIndices> {
        let builtParams: SelectionParams<TEntity, TIndices> = { ...this.params, index }
        return new DslBoundary(this.store, builtParams)
    }
}

export class DslSkip<TEntity, TIndices extends keyof TEntity> extends DslHaving<TEntity, TIndices>  {
    constructor(store: QueryableStore<TEntity, any, any>, params: SelectionParams<TEntity, any>) { super(store, params) }

    skip(num: number): DslHaving<TEntity, TIndices> {
        let builtParams: SelectionParams<TEntity, TIndices> = { ...this.params, skip: num }
        return new DslHaving(this.store, builtParams)
    }
}
