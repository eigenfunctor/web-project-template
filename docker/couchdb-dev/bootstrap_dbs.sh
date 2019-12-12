sleep 10

curl -H "x-auth-couchdb-username: bootstrap_user" -H "x-auth-couchdb-roles: _admin" -X PUT http://localhost:5984/_users
curl -H "x-auth-couchdb-username: bootstrap_user" -H "x-auth-couchdb-roles: _admin" -X PUT http://localhost:5984/_replicator
curl -H "x-auth-couchdb-username: bootstrap_user" -H "x-auth-couchdb-roles: _admin" -X PUT http://localhost:5984/_global_changes
