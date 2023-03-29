import {Account, Block, AleoNetworkClient, Transaction} from "../src";
import {privateKeyString} from "./data/account-data";
import {RecordCiphertext} from "@aleohq/wasm";
jest.retryTimes(3);

describe('NodeConnection', () => {
    let connection: AleoNetworkClient;
    let local_connection: AleoNetworkClient;

    beforeEach(() => {
        connection = new AleoNetworkClient("https://vm.aleo.org/api");
        local_connection = new AleoNetworkClient("http://localhost:3030");
    });

    describe('setAccount', () => {
        it('should set the account property', () => {
            const account = new Account();
            connection.setAccount(account);
            expect(connection.getAccount()).toEqual(account);
        }, 60000);
    });

    describe('getBlock', () => {
        it('should return a Block object', async () => {
            const block = await connection.getBlock(1);
            expect((block as Block).block_hash).toEqual("ab128sn9ju8r9fp3sc8px9l6m6ceruzzy4ahpnp05rzluygdqn6cqqs4jsf2q");
        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getBlock(99999999)).rejects.toThrow('Error fetching block.');
        }, 60000);
    });

    describe('getBlockRange', () => {
        it('should return an array of Block objects', async () => {
            const blockRange = await connection.getBlockRange(1, 3);
            expect(Array.isArray(blockRange)).toBe(true);
            expect((blockRange as Block[]).length).toBe(2);
            expect(((blockRange as Block[])[0] as Block).block_hash).toBe("ab128sn9ju8r9fp3sc8px9l6m6ceruzzy4ahpnp05rzluygdqn6cqqs4jsf2q");
            expect(((blockRange as Block[])[1] as Block).block_hash).toBe("ab10jhvxr4hx9488kkv4wz6vt0cu6gnjupk9rcg7djcvw0tsxgdggzq3h4s5j");

        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getBlockRange(999999999, 1000000000)).rejects.toThrow('Error fetching blocks between 999999999 and 1000000000.');
        }, 60000);
    });

    describe('getProgram', () => {
        it('should return a string', async () => {
            const program = await connection.getProgram('credits.aleo');
            expect(typeof program).toBe('string');
        }, 60000);

        it('should throw an error if the request fails', async () => {
            const program_id = "a" + (Math.random()).toString(32).substring(2) + ".aleo";
            await expect(connection.getProgram(program_id)).rejects.toThrow('Error fetching program');
        }, 60000);
    });

    describe('getLatestBlock', () => {
        it('should return a Block object', async () => {
            const latestBlock = await connection.getLatestBlock();
            expect(typeof (latestBlock as Block).block_hash).toBe('string');
        }, 60000);
    });

    describe('getLatestHash', () => {
        it('should return a string', async () => {
            const latestHash = await connection.getLatestHash();
            expect(typeof latestHash).toBe('string');
        }, 60000);
    });

    describe('getLatestHeight', () => {
        it('should return a number', async () => {
            const latestHeight = await connection.getLatestHeight();
            expect(typeof latestHeight).toBe('number');
        }, 60000);
    });


    describe('getStateRoot', () => {
        it('should return a string', async () => {
            const stateRoot = await connection.getStateRoot();
            expect(typeof stateRoot).toBe('string');
        }, 60000);
    });

    describe('getTransaction', () => {
        it('should return a Transaction object', async () => {
            const transaction = await connection.getTransaction('at1z4sgvtmc7mhd3qw2tdzc8mqyg60gx2qgtdzcg6e6k673d3pfz5psfhe3kd');
            expect((transaction as Transaction).type).toBe("execute");
        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getTransaction('nonexistentid')).rejects.toThrow('Error fetching transaction.');
        }, 60000);
    });

    describe('getTransactions', () => {
        it('should return an array of Transaction objects', async () => {
            const transactions = await connection.getTransactions(1);
            expect(Array.isArray(transactions)).toBe(true);
            expect((transactions as Transaction[]).length).toBeGreaterThan(0);
        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getTransactions(999999999)).rejects.toThrow('Error fetching transactions.');
        }, 60000);
    });

    describe('getTransitionId', () => {
        it('should return a transition id', async () => {
            const transition = await connection.getTransitionId('2429232855236830926144356377868449890830704336664550203176918782554219952323field')
            expect(typeof transition).toBe('string');
        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getTransitionId("garbage")).rejects.toThrow("Error fetching transition ID.");
        }, 60000);
    });

    describe('findUnspentRecords', () => {
        it('should fail if block heights or private keys are incorrectly specified', async () => {
            await expect(connection.findUnspentRecords(5, 0, privateKeyString, undefined, undefined)).rejects.toThrow();
            await expect(connection.findUnspentRecords(-5, 5, privateKeyString, undefined, undefined)).rejects.toThrow();
            await expect(connection.findUnspentRecords(0, 5, "definitelynotaprivatekey", undefined, undefined)).rejects.toThrow();
        }, 60000);

        it('should search a range correctly and not find records where none exist', async () => {
            const records = await connection.findUnspentRecords(0, 204, privateKeyString, undefined, undefined);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBe(0);
            }
        }, 90000);

        // Integration tests to be run with a local node (run with -s flag)
        it.skip('should find records', async () => {
            const records = await local_connection.findUnspentRecords(0, undefined, privateKeyString, undefined, undefined);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it.skip('should find records with specified amounts', async () => {
            let records = await local_connection.findUnspentRecords(0, undefined, privateKeyString, [100, 200], undefined);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBe(2);
            }

            records = await local_connection.findUnspentRecords(0, undefined, privateKeyString, undefined, 1000);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);
    });
});