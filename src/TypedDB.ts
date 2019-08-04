import { EntityClass } from './common'
import TypedStore from './TypedStore'
import QueryableStore from './QueryableStore'

interface StoreDefinition {
    name: string
    idProp: string
    indices?: Array<string>
}

interface UpgradeNeededHandler {
    (this: IDBOpenDBRequest, ev: IDBVersionChangeEvent): any
}

export class TypedDB {
    constructor(private dbName: string, private version: number, private onUpgradeNeeded?: UpgradeNeededHandler) {
    }

    private storeDefinitions: Array<StoreDefinition> = []
    public indexedDB: IDBDatabase

    defineStore<TEntity, TIdProp extends keyof TEntity>(
        entityClass: EntityClass<TEntity>,
        idProp: TIdProp,
    ): TypedStore<TEntity, TIdProp> 

    defineStore<TEntity, TIdProp extends keyof TEntity, TQueryableProps extends keyof TEntity>(
        entityClass: EntityClass<TEntity>,
        idProp: TIdProp,
        indices: Array<TQueryableProps>
    ): QueryableStore<TEntity, TIdProp, TQueryableProps>

    defineStore<TEntity, TIdProp extends keyof TEntity, TQueryableProps extends keyof TEntity>(
        entityClass: EntityClass<TEntity>,
        idProp: TIdProp,
        indices?: Array<TQueryableProps>
    ): TypedStore<TEntity, TIdProp> {

        this.storeDefinitions.push({
            name: entityClass.name,
            idProp: idProp.toString(),
            indices: indices && indices.map(i => i.toString())
        })

        if (indices) return new QueryableStore<TEntity, TIdProp, TQueryableProps>(this, entityClass, idProp, indices)
        else return new TypedStore<TEntity, TIdProp>(this, entityClass, idProp)
    }

    deleteDatabase(): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            let deleteRequest = indexedDB.deleteDatabase(this.dbName)

            deleteRequest.onsuccess = (event) => {
                resolve()
            }

            deleteRequest.onerror = reject
        })
    }

    open(): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            let openRequest = indexedDB.open(this.dbName, this.version)

            openRequest.onsuccess = (event) => {
                this.indexedDB = (event.target as any).result
                resolve()
            }

            openRequest.onerror = reject

            openRequest.onupgradeneeded = (event) => {
                let upgradeDb = (event.target as any).result as IDBDatabase

                // TODO handle case where storeDefinition exists, keypath needs modification, index need modification
                for (let storeDefinition of this.storeDefinitions) {
                    if (!upgradeDb.objectStoreNames.contains(storeDefinition.name)) {

                        let objectStore = upgradeDb.createObjectStore(storeDefinition.name, { keyPath: storeDefinition.idProp });

                        storeDefinition.indices && storeDefinition.indices
                            .filter(index => !objectStore.indexNames.contains(index))
                            .forEach(index => {
                                /*
                                if (IsFullIndexSpecifier(index))
                                    objectStore.createIndex(index.prop, index.prop, { unique: index.unique });
                                else 
                                    objectStore.createIndex(index, index, { unique: false });
                                    */
                                objectStore.createIndex(index, index);
                            })
                    }
                }

                // users can handle case of store keypaths and/or indexes changing
                this.onUpgradeNeeded && this.onUpgradeNeeded.call(openRequest, event)
            }
        })
    }
}

export default TypedDB
