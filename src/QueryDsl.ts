import { Exclusions } from './common'
import { Iterator } from './IterableStore'
import { Selector } from './QueryableStore'

/*
Query Builder DSL

store
    .take(10)
    .skip(20)

    .descending.over.propName.greaterThan(val)
    .iterate(ent => 'iterate')

    .having.propName.greaterThan(val).descending
    .select(ent => 'map')
*/


type Without<TEntity, TExclude> = Pick<TEntity, Exclude<keyof TEntity, keyof TExclude>>;

export interface DslOperator<TEntity> {
    iterate(iterator: Iterator<TEntity>): Promise<number>
    select(): Promise<Array<TEntity>>
    select<TMapped>(selector?: Selector<TEntity, TMapped>): Promise<Array<TMapped>>
}

export interface DslDirection<TEntity, TIndices extends keyof TEntity, TExclude> {
    ascending: DslQuery<TEntity, TIndices, DslDirection<TEntity, TIndices, TExclude> & TExclude>
    descending: DslQuery<TEntity, TIndices, DslDirection<TEntity, TIndices, TExclude> & TExclude>
}

export interface DslTake<TEntity, TIndices extends keyof TEntity, TExclude> {
    take(count: number): DslQuery<TEntity, TIndices, DslTake<TEntity, TIndices, TExclude> & TExclude>
}

export interface DslSkip<TEntity, TIndices extends keyof TEntity, TExclude> {
    skip(count: number): DslQuery<TEntity, TIndices, DslSkip<TEntity, TIndices, TExclude> & TExclude>
}

export interface DslPropSpec<TEntity, TIndices extends keyof TEntity, TExclude> {
    over: DslProperty<TEntity, TIndices, TExclude>
    having: DslProperty<TEntity, TIndices, TExclude>
}

export type DslProperty<TEntity, TIndices extends keyof TEntity, TExclude> = {
    [prop in TIndices]: DslBoundary<TEntity, TIndices, TEntity[prop], TExclude>
}

export interface DslBoundary<TEntity, TIndices extends keyof TEntity, TPropType, TExclude> {
    equaling(val: TPropType): DslQuery<TEntity, TIndices, DslPropSpec<TEntity, TIndices, TExclude> & TExclude>
    greaterThan(val: TPropType): DslQuery<TEntity, TIndices, DslPropSpec<TEntity, TIndices, TExclude> & TExclude>
    greaterThanOrEqualTo(val: TPropType): DslQuery<TEntity, TIndices, DslPropSpec<TEntity, TIndices, TExclude> & TExclude>
    lessThan(val: TPropType): DslQuery<TEntity, TIndices, DslPropSpec<TEntity, TIndices, TExclude> & TExclude>
    lessThanOrEqualTo(val: TPropType): DslQuery<TEntity, TIndices, DslPropSpec<TEntity, TIndices, TExclude> & TExclude>
    between(min: TPropType, max: TPropType, exclusions?: Exclusions): DslQuery<TEntity, TIndices, DslPropSpec<TEntity, TIndices, TExclude> & TExclude>
}

export type DslQuery<TEntity, TIndices extends keyof TEntity, TExclude = {}> =
    Without<
        DslPropSpec<TEntity, TIndices, TExclude> &
        DslTake<TEntity, TIndices, TExclude> &
        DslSkip<TEntity, TIndices, TExclude> &
        DslDirection<TEntity, TIndices, TExclude> &
        DslOperator<TEntity>, 
        TExclude>

interface Entity {
    id: number
    searchableString: string
    searchableDate: Date
}

let store: DslQuery<Entity, "searchableString" | "searchableDate">

store.over.searchableDate.equaling(new Date()).descending.skip(20).select()
