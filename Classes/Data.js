module.exports = (client) => { return {
	get: {
		server: function(id){
			return client.rdb.r.table("servers").get(id).default(null).run(client.rdb.conn);
		},
		servers: function(){
			return new Promise((resolve, reject) => {
				client.rdb.r.table("servers").run(client.rdb.conn, (err, data) => {
					if(err){ reject(err); }
					resolve(data.toArray());
				});
			});
		},
		webhooks: function(){
			return new Promise((resolve, reject) => {
				client.rdb.r.table("webhooks").run(client.rdb.conn, (err, data) => {
					if(err){ reject(err); }
					resolve(data.toArray());
				});
			});
		},
		webhooksOf: function(id){
			return new Promise((resolve, reject) => {
				client.rdb.r.table("webhooks").run(client.rdb.conn, (err, data) => {
					if(err){ reject(err); }
					resolve(data.toArray().map(webhook => {
						if(webhook[id] !== undefined){
							return { board: webhook["id"], id: id, bits: webhook[id].bits };
						}else{
							return undefined;
						}
					}).filter(webhook => {
						if(webhook !== undefined){
							return true;
						}else{
							return false;
						}
					}));
				});
			});
		},
		webhook: function(id, bid){
			return client.rdb.r.table("webhooks").get(bid)(id).default(null).run(client.rdb.conn);
		},
		webhookBoard: function(bid){
			return client.rdb.r.table("webhooks").get(bid).default(null).run(client.rdb.conn);
		},
		user: function(id){
			return client.rdb.r.table("users").get(id).default(null).run(client.rdb.conn);
		}
	},
	add: {
		board: function(id, bid){
			return new Promise((resolve, reject) => {
				client.rdb.r.table("servers").get(id).default(null).run(client.rdb.conn, (err, data) => {
					if(err){ reject(err); }
					if(data === null){
						client.rdb.r.table("servers").insert({ id: id, boards: [], current: bid }).run(client.rdb.conn, (err, data) => {
							if(err){ reject(err); }
							resolve(data);
						});
					}else{
						client.rdb.r.table("servers").get(id).update({ boards: client.rdb.r.row("boards").append(bid) }).run(client.rdb.conn, (err2, data2) => {
							if(err2){ reject(err2); }
							resolve(data2);
						});
					}
				});
			});
		},
		server: function(data){
			return client.rdb.r.table("servers").insert(data).run(client.rdb.conn);
		},
		webhook: function(id, bid, url, mid, wid){
			return new Promise((resolve, reject) => {
				client.rdb.r.table("webhooks").get(bid).default(null).run(client.rdb.conn, (err, data) => {
					if(err){ reject(err); }
					if(data === null){
						let table = { id: bid, modelId: mid};
						if(wid) table.webhookId = wid;
						table[id] = { webhook: url, bits: [] }
						client.rdb.r.table("webhooks").insert(table).run(client.rdb.conn, (err2, data2) => {
							if(err2){ reject(err2); }
							resolve(data2);
						});
					}else{
						let table = { modelId: mid };
						if(wid) table.webhookId = wid;
						table[id] = { webhook: url, bits: [] };
						client.rdb.r.table("webhooks").get(bid).update(table).run(client.rdb.conn, (err2, data2) => {
							if(err2){ reject(err2); }
							resolve(data2);
						});
					}
				});
			});
		}
	},
	setup: {
		server: function(id, c){
			return client.rdb.r.table("servers").insert({ id: id, boards: [ c ], current: c }).run(client.rdb.conn);
		}
	},
	delete: {
		board: function(id, bid){
            return client.rdb.r.table("servers")
                .get(id).update({ boards: client.rdb.r.row('boards')
                .difference([ bid ]) }).default(null).run(client.rdb.conn);
		},
		webhook: function(id, bid){
			return new Promise((resolve, reject) => {
				client.rdb.r.table("webhooks").get(bid).default(null).run(client.rdb.conn, (err, data) => {
					if(err){ reject(err); }
					if(data === null){ reject(404); }
					let table = data;
					delete table[id]
					if(Object.keys(table).length <= 3){
						client.rdb.r.table("webhooks").get(bid).delete().run(client.rdb.conn, (err2, data2) => {
							if(err2){ reject(err2); }
							resolve(data2);
						});
					}else{
						client.rdb.r.table("webhooks").get(bid).replace(table).run(client.rdb.conn, (err2, data2) => {
							if(err2){ reject(err2); }
							resolve(data2);
						});
					}
				});
			});
		}
	},
	set: {
		server: function(id, data){
			return client.rdb.r.table("servers").get(id).update(data).run(client.rdb.conn);
		},
		user: function(id, data){
			return client.rdb.r.table("users").get(id).update(data).run(client.rdb.conn);
		},
		webhook: function(id, bid, bits){
			return new Promise((resolve, reject) => {
				client.rdb.r.table("webhooks").get(bid).default(null).run(client.rdb.conn, (err, data) => {
					if(err){ reject(err); }
					if(data === null){ reject(404); }
					let table = {};
					table[id] = { bits: bits }
					client.rdb.r.table("webhooks").get(bid).update(table).run(client.rdb.conn, (err2, data2) => {
						if(err2){ reject(err2); }
						resolve(data2);
					});
				});
			});
		}
	}
}}