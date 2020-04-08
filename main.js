'use strict';

/*
 * Created with @iobroker/create-adapter v1.23.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const request = require('request-promise-native');
const testData = require('./lib/testData.js');
const stateAttr = require('./lib/stateAttr.js');

// Load your modules here, e.g.:
// const fs = require("fs");

class Deutschebahn extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'deutschebahn',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));

		this.citys = {};
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {

		try{

			await this.getStations();

		/*	let city = this.config.city;
			city = city !== undefined ? city || 'Berlin' : 'Berlin';
			// Try to call API and get global information
			let values = null;
			if(this.config.testData){
				values = testData;
				this.log.debug(`Test Data set : ${JSON.stringify(testData)}`);
			}
			else{

				
			}
			if(!values) return;

			for (const arrayIndex of Object.keys(values)) {
				this.log.info(JSON.stringify(values[arrayIndex]));
				const name = values[arrayIndex].name;
				for (const attributes in values[arrayIndex]){
					await this.localCreateState(attributes,attributes,values[arrayIndex][attributes]);
					this.log.debug(`Attributes ${attributes} of the Array ${arrayIndex} with Name ${name}`);

				this.citys[name] = values[arrayIndex];

				}
			}
*/

			this.terminate ? this.terminate() : process.exit();
			this.log.debug(`Run finished ${JSON.stringify(this.citys)}`);

		} catch (error) {
			this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
			this.terminate ? this.terminate() : process.exit();
		}
		
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		//this.log.info('Hello World !!!');
		

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectAsync('testVariable', {
			type: 'state',
			common: {
				name: 'testVariable',
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: true,
			},
			native: {},
		});

		// in this template all states changes inside the adapters namespace are subscribed
		// this.subscribeStates('*');

		/*
		setState examples
		you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*
		// the variable testVariable is set to true as command (ack=false)
		await this.setStateAsync('testVariable', true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		await this.setStateAsync('testVariable', { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync('admin', 'iobroker');
		this.log.info('check user admin pw iobroker: ' + result);

		result = await this.checkGroupAsync('admin', 'admin');
		this.log.info('check group user admin group admin: ' + result);
		this.log.info('Adapter startet'); 
		*/
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info('cleaned everything up...');
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	async localCreateState(state, name, value) {
		this.log.debug(`Create_state called for : ${state} with value : ${value}`);

		try {
			// Try to get details from state lib, if not use defaults. throw warning if states is not known in attribute list
			if (stateAttr[name] === undefined) {
				this.log.warn(`State attribute definition missing for + ${name}`);
			}
			const writable = stateAttr[name] !== undefined ? stateAttr[name].write || false : false;
			const state_name = stateAttr[name] !== undefined ? stateAttr[name].name || name : name;
			const role = stateAttr[name] !== undefined ? stateAttr[name].role || 'state' : 'state';
			const type = stateAttr[name] !== undefined ? stateAttr[name].type || 'mixed' : 'mixed';
			const unit = stateAttr[name] !== undefined ? stateAttr[name].unit || '' : '';
			this.log.debug(`Write value : ${writable}`);

			await this.setObjectNotExistsAsync(state, {
				type: 'state',
				common: {
					name: state_name,
					role: role,
					type: type,
					unit: unit,
					write: writable
				},
				native: {},
			});

			// Ensure name changes are propagated
			await this.extendObjectAsync(state, {
				type: 'state',
				common: {
					name: state_name,
				},
			});

			// Only set value if input != null
			if (value !== null) {
				await this.setState(state, { val: value, ack: true });
			}

			// Subscribe on state changes if writable
			// writable && this.subscribeStates(state);
		} catch (error) {
			this.log.error(`[localCreateState] error: ${error.message}, stack: ${error.stack}`);
		}
	}

	async getStations(){


		try {
			let values = null;
			const cityArray = [];
			const city =  this.config.city !== undefined ?  this.config.city || 'Berlin' : 'Berlin';

			const result = await request(`https://api.deutschebahn.com/freeplan/v1/location/${city}`);
			this.log.debug(`Data from DB API received : ${result}`);
			values = JSON.parse(result);

			if(!values) return;

			for (const arrayIndex of Object.keys(values)) {
				this.log.info(JSON.stringify(values[arrayIndex]));
				const name = values[arrayIndex].name;
				cityArray.push(name);


			}

			await this.extendObjectAsync('citys', {
				type: 'state',
				common: {
					name: `City array`,
				},
				native: {
					cityArray
				},
			});

			await this.setStateAsync('citys', {val: JSON.stringify(cityArray), ack: true});

		} catch (error) {
			this.log.error(`[API request failed] error: ${error.message}, stack: ${error.stack}`);
		}

	}




	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === 'object' && obj.message) {
	// 		if (obj.command === 'send') {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info('send command');

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
	// 		}
	// 	}
	// }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Deutschebahn(options);
} else {
	// otherwise start the instance directly
	new Deutschebahn();
}