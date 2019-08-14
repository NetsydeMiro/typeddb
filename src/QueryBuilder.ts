import { Direction, QueryParams } from './common'
import TypedDB from './TypedDB'
import { Iterator } from './IterableStore'
import { QueryableStore, Selector } from './QueryableStore'
import { DslQuery, DslTake, DslSkip, DslDirection, DslPropSpec, DslProperty, DslOperator } from './QueryDsl'

export interface Selector<TEntity, TMapped> {
    (entity: TEntity, ix: number): TMapped
}

export class QueryBuilder<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity> 
    implements DslQuery<TEntity, TIndices>
{
    constructor(private store: QueryableStore<TEntity, TIdProp, TIndices>, private params: QueryParams<TEntity, TIndices>) {
    }

    take(count: number): DslQuery<TEntity, TIndices, DslTake<TEntity, TIndices, {}>> {
        let params = {...this.params, take: count}
        return new QueryBuilder(this.store, params)
    }

    skip(count: number): DslQuery<TEntity, TIndices, DslSkip<TEntity, TIndices, {}>> {
        let params = {...this.params, skip: count}
        return new QueryBuilder(this.store, params)
    }

    over: DslProperty<TEntity, TIndices, {}>

    having: DslProperty<TEntity, TIndices, {}>

    private addDirection(direction: Direction) {
        let params = {...this.params, direction}
        return new QueryBuilder(this.store, params)
    }

    get ascending(): DslQuery<TEntity, TIndices, DslDirection<TEntity, TIndices, {}>> {
        return this.addDirection('ascending')
    }

    get descending(): DslQuery<TEntity, TIndices, DslDirection<TEntity, TIndices, {}>> {
        return this.addDirection('descending')
    }

    iterate(iterator: Iterator<TEntity>): Promise<number> {
        return this.store.doIterate(this.params, iterator)
    }

    select(): Promise<Array<TEntity>>
    select<TMapped>(selector?: Selector<TEntity, TMapped>): Promise<Array<TMapped>> {
        return this.store.doSelect(this.params, selector)
    }
}

export default QueryBuilder

class Entity {
    id: number
    searchableString: string
    searchableDate: Date
}

let store = new QueryableStore({} as TypedDB, Entity, "id", ["searchableString"])
let dsl = new QueryBuilder(store, {})

dsl.having.searchableString.equaling('test').skip(20).take(20).select()

