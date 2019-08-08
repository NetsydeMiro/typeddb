import { EntityClass } from './common'
import TypedDB from './TypedDB'
import { IterableStore, IterateParams } from './IterableStore'
import { DslSkip } from './QueryableDsl'

export class QueryableStore<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity> extends IterableStore<TEntity, TIdProp, TIndices>
{
    constructor(db: TypedDB, entityClass: EntityClass<TEntity>, idProp: TIdProp, queryableProps: Array<TIndices>) {
        super(db, entityClass, idProp, queryableProps)
    }

    doSelect(params: IterateParams<TEntity, TIndices>): Promise<Array<TEntity>> {
        return new Promise<Array<TEntity>>((resolve, reject) => {
            let result: Array<TEntity> = []

            try {
                this.doIterate(params, (entity) => {
                    if (entity) result.push(entity)
                    else resolve(result)
                })
            }
            catch (ex) { reject(ex) }
        })
    }

    select(count?: number): DslSkip<TEntity, TIndices> {
        let params: IterateParams<TEntity, TIndices> = { count }
        return new DslSkip(this, params)
    }
}

export default QueryableStore
