import { Direction, Range, toIDBDirection, EntityClass, All } from './common'
import { DslSkip } from './IterableDsl'
import TypedDB from './TypedDB'
import TypedStore from './TypedStore'

export interface Iterator<TEntity> {
    (entity: TEntity, ix: number): void
}

export interface IterateParams<TEntity, TIndices extends keyof TEntity> {
    index?: TIndices
    count?: number
    skip?: number
    range?: Range<TEntity[TIndices]>
    direction?: Direction
}

export class IterableStore<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity> extends TypedStore<TEntity, TIdProp>
{
    constructor(db: TypedDB, entityClass: EntityClass<TEntity>, idProp: TIdProp, private indexedProps: Array<TIndices>) {
        super(db, entityClass, idProp)
    }

    private readonly DEFAULT_ITERATE_PARAMS: IterateParams<TEntity, TIndices | TIdProp> = {
        index: this.idProp,
        count: Number.MAX_SAFE_INTEGER,
        skip: 0,
        range: new All(), 
        direction: "ascending"
    }

    doIterate(
        params: IterateParams<TEntity, TIndices>,
        iterator: Iterator<TEntity>): Promise<number> {

        return new Promise<number>((resolve, reject) => {
            let filledParams = Object.assign({}, this.DEFAULT_ITERATE_PARAMS, params)

            let index = this.db.indexedDB.transaction(this.storeName)
                .objectStore(this.storeName)
                .index(filledParams.index.toString())

            let idbRange = filledParams.range && filledParams.range.toIDBRange()
            let idbDirection = toIDBDirection(filledParams.direction)

            let req = index.openCursor(idbRange, idbDirection)

            let ix = 0
            req.onsuccess = (event) => {
                let cursor = (event.target as any).result as IDBCursorWithValue

                if (cursor) {
                    let entity = Object.assign(new this.entityClass(), cursor.value)
                    if (ix >= filledParams.skip && ix < filledParams.count) {
                        iterator(entity, ix)
                        ix++
                    }
                    cursor.continue()
                }
                else {
                    iterator(null, -1)
                    resolve(ix)
                }
            }

            req.onerror = reject
        })
    }

    iterate(count?: number): DslSkip<TEntity, TIndices> {
        let params: IterateParams<TEntity, TIndices> = { count }
        return new DslSkip(this, params)
    }
}

export default IterableStore
