### Run:
```bash
node index.js
```

### Parameters:
```-t``` to emit an event that contains the date every seconds

```-v``` verbose

---
Will emit as an event every body of a request recieved on the `/hook` endpoint
### Exemple: 
```bash
curl localhost:3010/hooks -H 'Content-Type: text/plain; charset=UTF-8' --data 'test2'
```