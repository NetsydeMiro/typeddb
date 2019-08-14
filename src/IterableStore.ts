import { toIDBDirection, EntityClass, QueryParams } from './common'
import { DslSkip } from './IterableDsl'
import TypedDB from './TypedDB'
import { TypedStore } from './TypedStore'

export interface Iterator<TEntity> {
    (entity: TEntity, ix: number): void
}

export class IterableStore<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity> extends TypedStore<TEntity, TIdProp, TIndices>
{
    constructor(db: TypedDB, entityClass: EntityClass<TEntity>, idProp: TIdProp, private indexedProps: Array<TIndices>) {
        super(db, entityClass, idProp)
    }

    doIterate(iterator: Iterator<TEntity>): Promise<number> 
    doIterate(params: QueryParams<TEntity, TIndices>, iterator: Iterator<TEntity>): Promise<number> 

    doIterate(arg1: QueryParams<TEntity, TIndices> | Iterator<TEntity>, arg2?: Iterator<TEntity>): Promise<number> {
        let params: QueryParams<TEntity, TIndices> 
        let iterator: Iterator<TEntity>

        if (!arg2) {
            params = {}
            iterator = arg1 as Iterator<TEntity>
        }
        else {
            params = arg1 as QueryParams<TEntity, TIndices>
            iterator = arg2
        }

        let filledParams = Object.assign({}, this.DEFAULT_SELECTION_PARAMS, params)
        let cursorable: IDBIndex | IDBObjectStore

        return new Promise<number>((resolve, reject) => {
            if (filledParams.index) {
                cursorable = this.db.indexedDB
                    .transaction(this.storeName)
                    .objectStore(this.storeName)
                    .index(filledParams.index.toString())
            }
            else {
                cursorable = this.db.indexedDB
                    .transaction(this.storeName)
                    .objectStore(this.storeName)
            }

            let idbRange = filledParams.range && filledParams.range.toIDBRange()
            let idbDirection = toIDBDirection(filledParams.direction)

            let req = cursorable.openCursor(idbRange, idbDirection)

            let start = filledParams.skip
            let end = filledParams.skip + filledParams.count
            let ix = 0
            let iterated = 0
            req.onsuccess = (event) => {
                let cursor = (event.target as any).result as IDBCursorWithValue

                if (cursor) {
                    let entity = Object.assign(new this.entityClass(), cursor.value)
                    if (ix >= start && ix < end) {
                        iterator(entity, iterated)
                        iterated++
                    }
                    ix++
                    cursor.continue()
                }
                else {
                    iterator(null, -1)
                    resolve(iterated)
                }
            }

            req.onerror = reject
        })
    }
}

export default IterableStore
