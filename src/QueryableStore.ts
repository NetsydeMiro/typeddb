import { EntityClass, SelectionParams } from './common'
import TypedDB from './TypedDB'
import { IterableStore } from './IterableStore'
import { DslSkip } from './QueryableDsl'

export interface Selector<TEntity, TMapped> {
    (entity: TEntity, ix: number): TMapped
}

export class QueryableStore<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity> extends IterableStore<TEntity, TIdProp, TIndices>
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

    select(count?: number): DslSkip<TEntity, TIndices> {
        let params: SelectionParams<TEntity, TIndices> = { count }
        return new DslSkip(this, params)
    }
}

export default QueryableStore
