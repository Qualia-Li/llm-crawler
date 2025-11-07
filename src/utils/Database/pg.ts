/**
 * From <https://node-postgres.com/guides/project-structure>
 */
//@ts-nocheck

import {Pool} from "pg";
import dotenv from "dotenv";

dotenv.config({path: "../../../.env"})

let pool: Pool

if (process.env.DB_HOST) {
    pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
} else {
    pool = new Pool({
        connectString: process.env.DATABASE_URL,
        password: new URL(process.env.DATABASE_URL).password,
        user: "postgres",
    })
}

export const query = async (text, params) => {
    const start = Date.now()
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('executed query', {text, duration, rows: res.rowCount})
    return res
}

export const getClient = async () => {
    const client = await pool.connect()
    const query = client.query
    const release = client.release
    // set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!')
        console.error(`The last executed query on this client was: ${client.lastQuery}`)
    }, 5000)
    // monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
        client.lastQuery = args
        return query.apply(client, args)
    }
    client.release = () => {
        // clear our timeout
        clearTimeout(timeout)
        // set the methods back to their old un-monkey-patched version
        client.query = query
        client.release = release
        return release.apply(client)
    }
    return client
}

console.log(await query("SELECT NOW()"))