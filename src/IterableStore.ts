import { Direction, Range, toIDBDirection, EntityClass } from './common'
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
        count: Number.MAX_SAFE_INTEGER,
        skip: 0,
        range: Range.all(), 
        direction: "ascending"
    }

    doIterate(iterator: Iterator<TEntity>): Promise<number> 
    doIterate(params: IterateParams<TEntity, TIndices>, iterator: Iterator<TEntity>): Promise<number> 

    doIterate(arg1: IterateParams<TEntity, TIndices> | Iterator<TEntity>, arg2?: Iterator<TEntity>): Promise<number> {
        let params: IterateParams<TEntity, TIndices> 
        let iterator: Iterator<TEntity>

        if (!arg2) {
            params = {}
            iterator = arg1 as Iterator<TEntity>
        }
        else {
            params = arg1 as IterateParams<TEntity, TIndices>
            iterator = arg2
        }

        return new Promise<number>((resolve, reject) => {
            let filledParams = Object.assign({}, this.DEFAULT_ITERATE_PARAMS, params)
            
            let cursorable: IDBIndex | IDBObjectStore

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

    iterate(count?: number): DslSkip<TEntity, TIndices> {
        let params: IterateParams<TEntity, TIndices> = { count }
        return new DslSkip(this, params)
    }
}

export default IterableStore
