import { EntityClass, Range, GetParams, QueryParams } from './common'
import TypedDB from './TypedDB'

/*
CRUD Operations
Correspond to native indexedDb function names.  
Return promises.

store.add
store.addRange
store.get
store.getAll
store.put
store.delete
store.clear
*/

export class TypedStore<TEntity, TIdProp extends keyof TEntity, TIndices extends keyof TEntity>{

    constructor(protected db: TypedDB, protected entityClass: EntityClass<TEntity>, protected idProp: TIdProp) { }

    protected get storeName(): string { return this.entityClass.name }

    protected readonly DEFAULT_SELECTION_PARAMS: QueryParams<TEntity, TIndices | TIdProp> = {
        count: 2 ** 32 - 1,
        skip: 0,
        range: Range.all(), 
        direction: "ascending"
    }

    private addHelper(store: IDBObjectStore, item: TEntity): Promise<TEntity> {
        return new Promise<TEntity>((resolve, reject) => {
            let req = store
                .add(item)

            req.onsuccess = (event) => {
                item[this.idProp] = (event.target as any).result as any
                resolve(item)
            }

            req.onerror = reject
        })
    }

    add(item: TEntity): Promise<TEntity> {
        let store = this.db.indexedDB.transaction(this.storeName, "readwrite")
            .objectStore(this.storeName)

        return this.addHelper(store, item)
    }

    addRange(items: Array<TEntity>): Promise<Array<TEntity>> {
        let store = this.db.indexedDB.transaction(this.storeName, "readwrite")
            .objectStore(this.storeName)

        return Promise.all(items.map(item => this.addHelper(store, item)))
    }

    get(id: TEntity[TIdProp]): Promise<TEntity> {
        return new Promise<TEntity>((resolve, reject) => {
            let req = this.db.indexedDB.transaction(this.storeName)
                .objectStore(this.storeName)
                .get(id as any)

            req.onsuccess = (event) => {
                let item = (event.target as any).result 
                let entity = Object.assign(new this.entityClass(), item)
                resolve(entity)
            }

            req.onerror = reject
        })
    }

    getAll(params?: GetParams<TEntity, TIndices>): Promise<Array<TEntity>> {
        return new Promise<Array<TEntity>>((resolve, reject) => {

            let filledParams = Object.assign({}, this.DEFAULT_SELECTION_PARAMS, params)
            
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

            let req = cursorable
                .getAll(filledParams.range.toIDBRange(), filledParams.count)

            req.onsuccess = (event) => {
                let items = (event.target as any).result as Array<TEntity>
                let entities = items.map(ent => Object.assign(new this.entityClass(), ent))
                resolve(entities)
            }
            req.onerror = reject
        })
    }

    put(item: TEntity): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let req = this.db.indexedDB.transaction(this.storeName, "readwrite")
                .objectStore(this.storeName)
                .put(item);

            req.onsuccess = (event) => resolve()
            req.onerror = reject
        })
    }

    delete(id: TEntity[TIdProp]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let req = this.db.indexedDB.transaction(this.storeName, "readwrite")
                .objectStore(this.storeName)
                .delete(id as any)

            req.onsuccess = (event) => resolve()
            req.onerror = reject
        })
    }

    clear(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let req = this.db.indexedDB.transaction(this.storeName, "readwrite")
                .objectStore(this.storeName)
                .clear()

            req.onsuccess = (event) => resolve()
            req.onerror = reject
        })
    }
}

export default TypedStore
