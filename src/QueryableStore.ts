import { EntityClass, SelectionParams } from './common'
import TypedDB from './TypedDB'
import { IterableStore } from './IterableStore'
import { DslSkip } from './QueryableDsl'

export class QueryableStore<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity> extends IterableStore<TEntity, TIdProp, TIndices>
{
    constructor(db: TypedDB, entityClass: EntityClass<TEntity>, idProp: TIdProp, queryableProps: Array<TIndices>) {
        super(db, entityClass, idProp, queryableProps)
    }

    doSelect(params: SelectionParams<TEntity, TIndices>): Promise<Array<TEntity>> {
        return new Promise<Array<TEntity>>((resolve, reject) => {
            let result: Array<TEntity> = []

            try {
                if (params.skip) {
                    this.doIterate(params, (entity) => {
                        if (entity) result.push(entity)
                        else resolve(result)
                    })
                }
                else return this.getAll(params)
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
