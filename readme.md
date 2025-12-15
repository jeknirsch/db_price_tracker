# Railpricetracker
This project is for tracking DB prices of certain trips over a period leading up to the journey!  
See: [gemini3 chat](https://gemini.google.com/app/31f24d252a3d4494) for cooking history

Use raspi with cronjob for automated pulling. See [here](https://gemini.google.com/app/70096e74e5e71275) for more info on remote access.

# initialize
```bash
mkdir railtracker
cd railtracker
npm init -y
```


# requires
### node.js with
- [db-vendo-client](https://github.com/public-transport/db-vendo-client)
```bash
npm install db-vendo-client
```
- better-sqlite3

```bash
npm install better-sqlite3`
```
### python with
- pandas
- matplotlib
```bash
pip install pandas matplotlib
```


# usage
run `railtracker\tracker.js` periodically to update the database.
```bash
node tracker.js
```
Modify this to specify tracking time etc.

then call the `railtracker\analyze.py`to visualize the results.

```bash
python -m analyze
```