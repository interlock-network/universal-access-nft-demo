//
// INTERLOCK NETWORK & ALEPH ZERO
// PSP34 ACCESS NFT - AUTHENTICATE WALLET
//

// 
// This is the parent script for the access NFT authentication process.
// It runs persistently, and spawns a verifyWalletChild process each time somebody
// wishes to authenticate the fact that they possess an access NFT,
// to establish access credentials of some sort. This script is meant to
// be simple, limited to listening for requests to authenticate, and spawing
// script to gather credentials in the case of authentication success.
//

const colors = require('colors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fork = require('child_process').fork;
const verifyWallet = path.resolve('verifyWallet.js');
const getCredentials = path.resolve('getCredentials.js');
const setAuthenticated = path.resolve('setAuthenticated.js');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { ContractPromise, CodePromise } = require('@polkadot/api-contract');
require('dotenv').config();

// server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const PORT = 3000;

// constants
const OWNER_MNEMONIC = process.env.OWNER_MNEMONIC;
const OWNER_ADDRESS = process.env.OWNER_ADDRESS;
const WEB_SOCKET = process.env.WEB_SOCKET;
const metadata = require('./access_metadata.json');
const AMOUNT = 1;


async function listen(message) {

  // establish connection with blockchain
  const wsProvider = new WsProvider(WEB_SOCKET);
  const api = await ApiPromise.create({ provider: wsProvider });
  console.log(`ACCESSNFT:`.blue.bold +
		` established websocket connection with Aleph Zero blockchain ` + `${WEB_SOCKET}`.magenta.bold);
	
	// successful authenticateWallet initialization
	console.log(`ACCESSNFT:`.green.bold +
		` core access authentication service initialized`.bold);
	console.log('');
	console.log(`           ! please initialize or connect NFT access application`.bold);
	console.log('');

  // create signing keypair
  const keyring = new Keyring({type: 'sr25519'});
  const OWNER_pair = keyring.addFromUri(OWNER_MNEMONIC);

	let notAuthenticatedId;

  // subscribe to system events via storage
  api.query.system.events((events) => {

    // loop through the Vec<EventRecord>
    events.forEach((record) => {

      // get data from the event record
      const { event, phase } = record;

			// listen for Transfer events
      if (event.method == 'Transfer') {

						//console.log(event)
        // check for verification transfers
				//
				// from Interlock
        if ( event.data[0] == OWNER_ADDRESS &&
          event.data[2] == AMOUNT) {

          console.log(`ACCESSNFT:`.green.bold +
						` authentication transfer complete to wallet ` + `${event.data[1]}`.magenta.bold);
          console.log(`ACCESSNFT:`.yellow.bold +
						` waiting on returning verification transfer to wallet ` + `${event.data[1]}`.magenta.bold);
        //
        // from wallet holder
        } else if (event.data[1] == OWNER_ADDRESS &&
					event.data[2] == AMOUNT) {

          console.log(`ACCESSNFT:`.green.bold +
						` verification transfer complete from wallet ` + `${event.data[0]}`.magenta.bold);
          console.log(`ACCESSNFT:`.green.bold +
						` wallet ` +	`${event.data[0]}`.magenta.bold + ` is verified`);

    			// get NFT collection for wallet
    			let { gasRequired, storageDeposit, result, output } =
      			await contract.query['ilockerCollection']
						(OWNER_PAIR.address, {}, event.data[0]);

    			// check if the call was successful
    			if (result.isOk) {

      			// find the waiting nft to authenticate
      			const collection = JSON.parse(JSON.stringify(output));
      			for (nft in collection.ok) {

        			// get attribute iswaiting state
        			let { gasRequired, storageDeposit, result, output } =
          			await contract.query['psp34Metadata::getAttribute']
								(OWNER_PAIR.address, {}, {u64: collection.ok[nft].u64}, ISWAITING);
        			let waiting = JSON.parse(JSON.stringify(output));

        			// record nft id of one that is waiting and ready to authenticate
        			if (waiting == TRUE) {

          			notAuthenticatedId = collection.ok[nft].u64;

								// change contract state to indicate nft is authenticated
          			const setAuthenticatedChild = fork(setAuthenticated);
          			setAuthenticatedChild.send({id: notAuthenticatedId, wallet: event.data[0]});
        			}
        		}
      		}
        }
      }
    });
  });
}


// interprocess and server client-app messaging
io.on('connection', (socket) => {

	// initiate authentication process for a wallet
	socket.on('authenticate-nft', (wallet) => {

  	console.log(`ACCESSNFT:`.green.bold +
			` initiating authentication process for wallet ` + `${wallet}`.magenta.bold);

		const verifyWalletChild = fork(verifyWallet);
		verifyWalletChild.send({wallet: wallet});
	}); 

	// relay authentication success to application
  socket.on('nft-authenticated', (id) => {
    console.log(`ACCESSNFT:`.green.bold +
			` NFT ID ` + `${id}`.magenta.bold + ` successfully authenticated`);
		socket.emit('authentication-success');
  });

	// relay still waiting status to application
  socket.on('still-waiting', (id, wallet) => {
		socket.emit('still-need-micropayment', id, wallet);
  });

	// relay waiting status to application
  socket.on('awaiting-transfer', (id, wallet) => {
		socket.emit('need-micropayment', id, wallet);
  });

	// relay all already authenticated status to application
  socket.on('all-nfts-authenticated', (wallet) => {
		socket.emit('nfts-already-authenticated', wallet);
  });

	// relay setAuthentication contract failure to application
  socket.on('setauthenticated-failure', (id, wallet) => {
		socket.emit('failed-setauthenticated', id, wallet);
  });

	// relay setWaiting contract failure to application
  socket.on('setwaiting-failure', (id, wallet) => {
		socket.emit('failed-setwaiting', id, wallet);
  });
});

// fire up http server
http.listen(PORT, () => {
  console.log(`ACCESSNFT:`.blue.bold +
		` listening on ` + `*:`.magenta.bold + `${PORT}`.magenta.bold);
});

// initiate async function that listens for transfer events
listen().catch((error) => {
	console.error(error);
	process.exit(-1);
});


