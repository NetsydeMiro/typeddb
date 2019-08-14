import { EntityClass, SelectionParams } from './common'
import TypedDB from './TypedDB'
import { IterableStore, Iterator } from './IterableStore'
import { Dsl, DslTake, DslSkip, DslDirection, DslPropSpec, DslProperty, DslOperator } from './DslFluid'

export interface Selector<TEntity, TMapped> {
    (entity: TEntity, ix: number): TMapped
}

export class QueryableStore<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity> 
    extends IterableStore<TEntity, TIdProp, TIndices>
    implements Dsl<TEntity, TIndices>
{
    constructor(db: TypedDB, entityClass: EntityClass<TEntity>, idProp: TIdProp, queryableProps: Array<TIndices>) {
        super(db, entityClass, idProp, queryableProps)
    }

    doSelect(): Promise<Array<TEntity>>
    doSelect(params: SelectionParams<TEntity, TIndices>): Promise<Array<TEntity>>

    doSelect<TMapped>(selector: Selector<TEntity, TMapped>): Promise<Array<TMapped>> 
    doSelect<TMapped>(params: SelectionParams<TEntity, TIndices>, selector: Selector<TEntity, TMapped>): Promise<Array<TMapped>>

    doSelect<TMapped = TEntity>(arg1?: SelectionParams<TEntity, TIndices> | Selector<TEntity, TMapped>, arg2?: Selector<TEntity, TMapped>): Promise<Array<TMapped|TEntity>> {

        let params: SelectionParams<TEntity, TIndices> 
        let selector: Selector<TEntity, TMapped> 

        if (arg2) {
            params = arg1 as SelectionParams<TEntity, TIndices>
            selector = arg2 as Selector<TEntity, TMapped>
        }
        else if (arg1) {
            if(typeof arg1 == 'function') {
                params = {} as SelectionParams<TEntity, TIndices>
                selector = arg1
            }
            else {
                params = arg1 as SelectionParams<TEntity, TIndices>
                selector = null
            }
        }

        let filledParams = Object.assign({}, this.DEFAULT_SELECTION_PARAMS, params)

        return new Promise<Array<TEntity|TMapped>>(async (resolve, reject) => {
            let result: Array<TEntity | TMapped> = []

            try {
                if (filledParams.skip) {
                    this.doIterate(params, (entity, ix) => {
                        if (entity) {
                            if (selector) result.push(selector(entity, ix)) 
                            else result.push(entity)
                        }
                        else resolve(result)
                    })
                }
                else {
                    let entities = await this.getAll(params)
                    if (selector) result = entities.map((e, ix) => selector(e, ix))
                    else result = entities
                    resolve(result)
                }
            }
            catch (ex) { reject(ex) }
        })
    }

    take(count: number): Dsl<TEntity, TIndices, DslTake<TEntity, TIndices, {}>> {
        return {} as Dsl<TEntity, TIndices, DslTake<TEntity, TIndices, {}>>
    }

    skip(count: number): Dsl<TEntity, TIndices, DslSkip<TEntity, TIndices, {}>> {
        return {} as Dsl<TEntity, TIndices, DslSkip<TEntity, TIndices, {}>>
    }

    over: DslProperty<TEntity, TIndices, {}>
    having: DslProperty<TEntity, TIndices, {}>
    ascending: Dsl<TEntity, TIndices, DslDirection<TEntity, TIndices, {}>>
    descending: Dsl<TEntity, TIndices, DslDirection<TEntity, TIndices, {}>>

    iterate(iterator: Iterator<TEntity>): Promise<number> {
        return new Promise<number>((resolve, reject) => resolve(7))
    }

    select(): Promise<Array<TEntity>>
    select<TMapped>(selector?: Selector<TEntity, TMapped>): Promise<Array<TMapped>> {
        return new Promise<Array<TMapped>>((resolve, reject) => {

        })
    }
}

export default QueryableStore
