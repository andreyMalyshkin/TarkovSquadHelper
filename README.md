# TarkovSquadHelper

**TarkovSquadHelper** is a backend service designed to help squads manage required items and track inventory collaboratively in **Escape from Tarkov**.

---

## 🚀 Features

- 🔎 **View all items** stored in the database.
- 🌐 **Update item data** from external Tarkov API.
- 🏠 **Create rooms** (separate MongoDB collections) for each squad run.
- 📦 **Add items** to a room for specific users, including quantity and nickname.
- ➕➖ **Increase or decrease item counts** for each user.
- 🗑️ **Remove items** or entire rooms when they're no longer needed.
- 🔍 **Search items** by name.

---

## 📦 Technologies Used

- **Node.js** + **Express**
- **TypeScript**
- **MongoDB** (via Mongoose)
- **Docker** (for MongoDB)
- **Winston Logger**

---

## 📄 API Endpoints Overview

| Method | Endpoint                    | Description                                                                                     |
|-------:|:----------------------------|:-----------------------------------------------------------------------------------------------|
| GET    | `/items`                    | Get all items from the database.                                                                |
| GET    | `/update`                   | Fetch and update the latest item data from external API.                                        |
| GET    | `/search?q=itemName`        | Search items by name.                                                                          |
| POST   | `/createCollection`         | Create a new room (collection) with a random name.                                              |
| POST   | `/addItemsToCollection`     | Add an item to a specific room for a user. Requires `tableName` and `item` object.              |
| DELETE | `/deleteItemFromCollection` | Remove an item from a specific room by item ID and user nickname.                               |
| GET    | `/getitemsFromCollection`   | Retrieve all items from a specific room. Requires `tableName` query parameter.                  |
| POST   | `/increaseItemCount`        | Increase item count for a user. Requires `tableName`, `item`, and optional `amount`.            |
| POST   | `/decreaseItemCount`        | Decrease item count for a user. Requires `tableName`, `item`, and optional `amount`.            |

---

## 🛠️ Setup Instructions

1. **Clone the repository:**

```bash
git clone git@github.com:yourusername/TarkovSquadHelper.git
cd TarkovSquadHelper
```

2. **Clone the repository:**
```bash
npm install
```

3. **Clone the repository:**

Create a .env file:
```text
PORT=3000
DB_URI=mongodb://admin:rootpassword@mongodb:27017/tarkov_db
```
4. **Start development server:**
```bash
npm run dev
```
**🤝 Contributing**
Pull requests and ideas are welcome!
Feel free to open issues or suggest improvements.

**📄 License**
This project is open-source and available under the MIT License.