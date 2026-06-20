import { useState, useMemo, useRef, useEffect } from "react";

const cheatsheets = [
  {
    id: "javascript",
    title: "JavaScript",
    icon: "JS",
    tagline: "The language of the web",
    ext: ".js",
    sections: [
      {
        heading: "Variables & Types",
        items: [
          { label: "let / const / var", code: `let x = 5;\nconst PI = 3.14;\nvar old = true;` },
          { label: "Destructuring", code: `const { name, age } = user;\nconst [a, b] = [1, 2];` },
          { label: "Template Literals", code: `const msg = \`Hello, \${name}!\`;` },
          { label: "Spread / Rest", code: `const arr2 = [...arr1, 4];\nfunction sum(...args) {}` },
        ],
      },
      {
        heading: "Functions",
        items: [
          { label: "Arrow Function", code: `const add = (a, b) => a + b;` },
          { label: "Default Params", code: `function greet(name = "World") {}` },
          { label: "Async / Await", code: `async function getData() {\n  const res = await fetch(url);\n  return res.json();\n}` },
          { label: "Promise", code: `fetch(url)\n  .then(res => res.json())\n  .catch(err => console.error(err));` },
        ],
      },
      {
        heading: "Array Methods",
        items: [
          { label: "map / filter / reduce", code: `arr.map(x => x * 2);\narr.filter(x => x > 0);\narr.reduce((acc, x) => acc + x, 0);` },
          { label: "find / some / every", code: `arr.find(x => x.id === 1);\narr.some(x => x > 5);\narr.every(x => x > 0);` },
          { label: "flat / flatMap", code: `[1,[2,3]].flat();\narr.flatMap(x => [x, x*2]);` },
        ],
      },
      {
        heading: "Objects & Classes",
        items: [
          { label: "Object Methods", code: `Object.keys(obj);\nObject.values(obj);\nObject.entries(obj);\nObject.assign({}, obj);` },
          { label: "Class", code: `class Animal {\n  constructor(name) { this.name = name; }\n  speak() { return \`\${this.name} makes a sound.\`; }\n}` },
          { label: "Optional Chaining", code: `const city = user?.address?.city;` },
          { label: "Nullish Coalescing", code: `const val = input ?? "default";` },
        ],
      },
    ],
  },
  {
    id: "react",
    title: "React",
    icon: "⚛",
    tagline: "Build UIs with components",
    ext: ".jsx",
    sections: [
      {
        heading: "Core Hooks",
        items: [
          { label: "useState", code: `const [count, setCount] = useState(0);\nsetCount(prev => prev + 1);` },
          { label: "useEffect", code: `useEffect(() => {\n  fetchData();\n  return () => cleanup();\n}, [dependency]);` },
          { label: "useRef", code: `const inputRef = useRef(null);\ninputRef.current.focus();` },
          { label: "useContext", code: `const theme = useContext(ThemeContext);` },
        ],
      },
      {
        heading: "Performance Hooks",
        items: [
          { label: "useMemo", code: `const result = useMemo(() => expensiveCalc(a, b), [a, b]);` },
          { label: "useCallback", code: `const handler = useCallback(() => {\n  doSomething(id);\n}, [id]);` },
          { label: "React.memo", code: `const MyComp = React.memo(({ value }) => (\n  <div>{value}</div>\n));` },
        ],
      },
      {
        heading: "Component Patterns",
        items: [
          { label: "Functional Component", code: `function Button({ label, onClick }) {\n  return <button onClick={onClick}>{label}</button>;\n}` },
          { label: "Conditional Render", code: `{isLoading ? <Spinner /> : <Content />}\n{error && <ErrorMsg msg={error} />}` },
          { label: "List Rendering", code: `{items.map(item => (\n  <Item key={item.id} data={item} />\n))}` },
          { label: "Custom Hook", code: `function useFetch(url) {\n  const [data, setData] = useState(null);\n  useEffect(() => { fetch(url).then(...) }, [url]);\n  return data;\n}` },
        ],
      },
      {
        heading: "React Router v6",
        items: [
          { label: "Setup", code: `<BrowserRouter>\n  <Routes>\n    <Route path="/" element={<Home />} />\n    <Route path="/user/:id" element={<User />} />\n  </Routes>\n</BrowserRouter>` },
          { label: "useNavigate / useParams", code: `const navigate = useNavigate();\nconst { id } = useParams();\nnavigate("/home");` },
        ],
      },
    ],
  },
  {
    id: "mongodb",
    title: "MongoDB",
    icon: "DB",
    tagline: "NoSQL document database",
    ext: ".js",
    sections: [
      {
        heading: "CRUD Operations",
        items: [
          { label: "Insert", code: `db.users.insertOne({ name: "Alice", age: 25 });\ndb.users.insertMany([{...}, {...}]);` },
          { label: "Find", code: `db.users.find({ age: { $gt: 18 } });\ndb.users.findOne({ email: "a@b.com" });` },
          { label: "Update", code: `db.users.updateOne(\n  { _id: id },\n  { $set: { name: "Bob" } }\n);\ndb.users.updateMany({ active: false }, { $set: { archived: true } });` },
          { label: "Delete", code: `db.users.deleteOne({ _id: id });\ndb.users.deleteMany({ age: { $lt: 13 } });` },
        ],
      },
      {
        heading: "Query Operators",
        items: [
          { label: "Comparison", code: `$eq, $ne, $gt, $gte, $lt, $lte\n{ age: { $gte: 18, $lte: 65 } }` },
          { label: "Logical", code: `$and, $or, $not, $nor\n{ $or: [{ age: 18 }, { admin: true }] }` },
          { label: "Array", code: `$in, $nin, $all, $elemMatch\n{ tags: { $in: ["js", "node"] } }` },
        ],
      },
      {
        heading: "Aggregation",
        items: [
          { label: "Pipeline", code: `db.orders.aggregate([\n  { $match: { status: "active" } },\n  { $group: { _id: "$userId", total: { $sum: "$amount" } } },\n  { $sort: { total: -1 } }\n]);` },
          { label: "Lookup (Join)", code: `{ $lookup: {\n  from: "users",\n  localField: "userId",\n  foreignField: "_id",\n  as: "user"\n}}` },
        ],
      },
      {
        heading: "Mongoose (ODM)",
        items: [
          { label: "Schema & Model", code: `const schema = new mongoose.Schema({\n  name: { type: String, required: true },\n  age: Number,\n  email: { type: String, unique: true }\n});\nconst User = mongoose.model("User", schema);` },
          { label: "Queries", code: `User.find().sort("-createdAt").limit(10);\nUser.findById(id).populate("posts");\nUser.findByIdAndUpdate(id, data, { new: true });` },
        ],
      },
    ],
  },
  {
    id: "nodejs",
    title: "Node.js",
    icon: "JS",
    tagline: "Server-side JavaScript runtime",
    ext: ".js",
    sections: [
      {
        heading: "Core Modules",
        items: [
          { label: "fs (File System)", code: `const fs = require('fs');\nfs.readFile('file.txt', 'utf8', (err, data) => {});\nfs.writeFileSync('out.txt', content);` },
          { label: "path", code: `const path = require('path');\npath.join(__dirname, 'views', 'index.html');\npath.extname('file.js'); // '.js'` },
          { label: "http", code: `const http = require('http');\nhttp.createServer((req, res) => {\n  res.end('Hello World');\n}).listen(3000);` },
        ],
      },
      {
        heading: "Express.js",
        items: [
          { label: "Setup", code: `const express = require('express');\nconst app = express();\napp.use(express.json());\napp.listen(3000);` },
          { label: "Routes", code: `app.get('/users', async (req, res) => {\n  const users = await User.find();\n  res.json(users);\n});\napp.post('/users', async (req, res) => {\n  const user = new User(req.body);\n  await user.save();\n  res.status(201).json(user);\n});` },
          { label: "Middleware", code: `app.use((req, res, next) => {\n  console.log(req.method, req.url);\n  next();\n});\n// Error handler\napp.use((err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n});` },
          { label: "Router", code: `const router = express.Router();\nrouter.get('/', getAll);\nrouter.post('/', create);\napp.use('/api/users', router);` },
        ],
      },
      {
        heading: "Environment & Process",
        items: [
          { label: "dotenv", code: `require('dotenv').config();\nconst PORT = process.env.PORT || 3000;\nconst DB_URI = process.env.MONGO_URI;` },
          { label: "process", code: `process.argv  // CLI args\nprocess.env   // env variables\nprocess.exit(0); // exit process` },
        ],
      },
    ],
  },
  {
    id: "cpp",
    title: "C++",
    icon: "C++",
    tagline: "Systems & performance programming",
    ext: ".cpp",
    sections: [
      {
        heading: "Basics",
        items: [
          { label: "Data Types", code: `int x = 5;\nfloat pi = 3.14f;\ndouble d = 3.14159;\nbool flag = true;\nchar c = 'A';\nstd::string s = "hello";` },
          { label: "Arrays & Vectors", code: `int arr[5] = {1,2,3,4,5};\nstd::vector<int> v = {1,2,3};\nv.push_back(4);\nv.size(); v.at(0);` },
          { label: "Pointers & References", code: `int x = 10;\nint* ptr = &x;   // pointer\nint& ref = x;    // reference\n*ptr = 20;       // dereference` },
        ],
      },
      {
        heading: "OOP",
        items: [
          { label: "Class", code: `class Animal {\nprivate:\n  std::string name;\npublic:\n  Animal(std::string n) : name(n) {}\n  void speak() { std::cout << name; }\n};` },
          { label: "Inheritance", code: `class Dog : public Animal {\npublic:\n  Dog(std::string n) : Animal(n) {}\n  void bark() { std::cout << "Woof!"; }\n};` },
          { label: "Templates", code: `template <typename T>\nT add(T a, T b) { return a + b; }\nadd<int>(1, 2);\nadd<double>(1.5, 2.5);` },
        ],
      },
      {
        heading: "STL",
        items: [
          { label: "map / unordered_map", code: `std::map<std::string, int> m;\nm["age"] = 25;\nm.find("age"); m.count("age");` },
          { label: "Algorithms", code: `#include <algorithm>\nstd::sort(v.begin(), v.end());\nstd::find(v.begin(), v.end(), val);\nstd::for_each(v.begin(), v.end(), fn);` },
          { label: "Smart Pointers", code: `#include <memory>\nauto p = std::make_unique<MyClass>();\nauto sp = std::make_shared<MyClass>();` },
        ],
      },
    ],
  },
  {
    id: "python",
    title: "Python",
    icon: "PY",
    tagline: "Simple, readable, powerful",
    ext: ".py",
    sections: [
      {
        heading: "Basics",
        items: [
          { label: "Data Types", code: `x = 5          # int\npi = 3.14      # float\nname = "Alice" # str\nflag = True    # bool\nlst = [1,2,3]  # list\ndct = {"a":1}  # dict\ntpl = (1,2)    # tuple\nst = {1,2,3}   # set` },
          { label: "List Comprehensions", code: `squares = [x**2 for x in range(10)]\nevens = [x for x in lst if x % 2 == 0]\nmatrix = [[i*j for j in range(3)] for i in range(3)]` },
          { label: "Unpacking", code: `a, b, c = [1, 2, 3]\nfirst, *rest = [1, 2, 3, 4]\n_, second = (10, 20)` },
        ],
      },
      {
        heading: "Functions",
        items: [
          { label: "Args & Kwargs", code: `def func(*args, **kwargs):\n    print(args)    # tuple\n    print(kwargs)  # dict\nfunc(1, 2, name="Alice")` },
          { label: "Lambda", code: `square = lambda x: x**2\nsorted_list = sorted(lst, key=lambda x: x.age)` },
          { label: "Decorators", code: `def logger(func):\n    def wrapper(*args, **kwargs):\n        print(f"Calling {func.__name__}")\n        return func(*args, **kwargs)\n    return wrapper\n@logger\ndef greet(): pass` },
        ],
      },
      {
        heading: "OOP",
        items: [
          { label: "Class", code: `class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return f"{self.name} makes a sound"` },
          { label: "Inheritance", code: `class Dog(Animal):\n    def speak(self):\n        return f"{self.name} says Woof!"` },
          { label: "Dunder Methods", code: `def __str__(self): return self.name\ndef __len__(self): return len(self.items)\ndef __eq__(self, other): return self.id == other.id` },
        ],
      },
      {
        heading: "Useful Built-ins",
        items: [
          { label: "Itertools & Functools", code: `from itertools import chain, product, groupby\nfrom functools import reduce, partial\nreduce(lambda a,b: a+b, [1,2,3,4])` },
          { label: "Context Managers", code: `with open("file.txt", "r") as f:\n    content = f.read()` },
          { label: "Error Handling", code: `try:\n    result = 10 / 0\nexcept ZeroDivisionError as e:\n    print(f"Error: {e}")\nfinally:\n    print("Always runs")` },
        ],
      },
    ],
  },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .cs-root {
    --bg:        #060606;
    --bg-raised: #0c0c0c;
    --bg-card:   #0e0e0e;
    --bg-inset:  #050505;
    --line:      #1c1c1c;
    --line-soft: #141414;
    --ink:       #e8e6e1;
    --ink-dim:   #6f6f6f;
    --ink-faint: #3d3d3d;
    --orange:    #ff7a18;
    --orange-dim: #ff7a1822;
    --orange-soft:#ff7a1812;

    min-height: 100vh;
    background:
      radial-gradient(ellipse 900px 500px at 50% -10%, #ff7a1810, transparent 60%),
      var(--bg);
    font-family: 'JetBrains Mono', monospace;
    color: var(--ink);
    padding: 0 0 80px;
  }

  .cs-root *:focus-visible {
    outline: 2px solid var(--orange);
    outline-offset: 2px;
  }

  /* ---------- Top bar ---------- */
  .cs-topbar {
    border-bottom: 1px solid var(--line);
    background: rgba(6,6,6,0.9);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .cs-topbar-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .cs-dots { display: flex; gap: 6px; flex-shrink: 0; }
  .cs-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--line); }
  .cs-dot.live { background: var(--orange); box-shadow: 0 0 8px var(--orange); }

  .cs-brand {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--ink);
    letter-spacing: -0.01em;
    flex-shrink: 0;
  }
  .cs-brand span { color: var(--orange); }

  .cs-search-wrap {
    flex: 1;
    position: relative;
    max-width: 420px;
  }

  .cs-search {
    width: 100%;
    background: var(--bg-inset);
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 9px 12px 9px 34px;
    color: var(--ink);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    transition: border-color 0.15s;
  }
  .cs-search::placeholder { color: var(--ink-faint); }
  .cs-search:focus { border-color: var(--orange); outline: none; }

  .cs-search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--ink-faint);
    font-size: 0.8rem;
    pointer-events: none;
  }

  .cs-search-kbd {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.65rem;
    color: var(--ink-faint);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 1px 5px;
    pointer-events: none;
  }

  .cs-topbar-meta {
    margin-left: auto;
    color: var(--ink-dim);
    font-size: 0.72rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ---------- Header ---------- */
  .cs-header {
    max-width: 1180px;
    margin: 0 auto;
    padding: 56px 24px 36px;
  }

  .cs-header-eyebrow {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--orange);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cs-header-eyebrow::before {
    content: '';
    width: 16px;
    height: 1px;
    background: var(--orange);
  }

  .cs-header h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.6rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--ink);
    margin-bottom: 10px;
  }

  .cs-header p {
    color: var(--ink-dim);
    font-size: 0.92rem;
    max-width: 540px;
    line-height: 1.6;
  }

  .cs-header-stats {
    display: flex;
    gap: 28px;
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid var(--line-soft);
  }

  .cs-stat-num {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--orange);
  }

  .cs-stat-label {
    font-size: 0.68rem;
    color: var(--ink-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 2px;
  }

  /* ---------- Grid ---------- */
  .cs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 14px;
    max-width: 1180px;
    margin: 0 auto 48px;
    padding: 0 24px;
  }

  .cs-no-results {
    max-width: 1180px;
    margin: 0 auto;
    padding: 60px 24px;
    text-align: center;
    color: var(--ink-dim);
  }

  .cs-no-results-code {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.85rem;
    color: var(--ink-faint);
    margin-top: 8px;
  }

  .cs-card {
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 22px 20px 18px;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
    position: relative;
    text-align: left;
    font-family: inherit;
    color: inherit;
  }

  .cs-card:hover, .cs-card:focus-visible {
    border-color: var(--orange);
    transform: translateY(-2px);
    background: #0f0f0f;
  }

  .cs-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 22px;
  }

  .cs-card-icon {
    width: 38px;
    height: 38px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    font-weight: 700;
    background: var(--orange-soft);
    color: var(--orange);
    border: 1px solid var(--orange-dim);
    font-family: 'Space Grotesk', sans-serif;
    flex-shrink: 0;
  }

  .cs-card-ext {
    font-size: 0.66rem;
    color: var(--ink-faint);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 2px 6px;
    font-weight: 500;
  }

  .cs-card-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 5px;
    letter-spacing: -0.01em;
  }

  .cs-card-tagline {
    font-size: 0.76rem;
    color: var(--ink-dim);
    margin-bottom: 16px;
    line-height: 1.4;
  }

  .cs-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 14px;
    border-top: 1px solid var(--line-soft);
  }

  .cs-card-count {
    font-size: 0.68rem;
    color: var(--ink-faint);
  }

  .cs-card-arrow {
    color: var(--orange);
    font-size: 0.78rem;
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.15s ease;
  }

  .cs-card:hover .cs-card-arrow { opacity: 1; transform: translateX(0); }

  /* ---------- Detail Panel ---------- */
  .cs-detail {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px;
    animation: csFadeUp 0.25s ease;
  }

  @keyframes csFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .cs-detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 28px 0 24px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .cs-back-btn {
    background: var(--bg-card);
    border: 1px solid var(--line);
    color: var(--ink-dim);
    padding: 8px 14px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 500;
    font-family: 'JetBrains Mono', monospace;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .cs-back-btn:hover { border-color: var(--orange); color: var(--orange); }

  .cs-detail-title-wrap h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.02em;
  }

  .cs-detail-title-wrap p {
    color: var(--ink-dim);
    font-size: 0.8rem;
    margin-top: 2px;
  }

  .cs-detail-jump {
    margin-left: auto;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .cs-jump-pill {
    font-size: 0.68rem;
    color: var(--ink-dim);
    border: 1px solid var(--line);
    background: var(--bg-card);
    border-radius: 20px;
    padding: 5px 11px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'JetBrains Mono', monospace;
  }

  .cs-jump-pill:hover { border-color: var(--orange); color: var(--orange); }

  .cs-sections {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(470px, 1fr));
    gap: 18px;
    padding-bottom: 20px;
  }

  .cs-section {
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    scroll-margin-top: 90px;
  }

  .cs-section-heading {
    padding: 12px 18px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: var(--bg-inset);
    border-bottom: 1px solid var(--line);
    color: var(--orange);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cs-section-heading::before { content: '#'; opacity: 0.5; }

  .cs-item {
    border-bottom: 1px solid var(--line-soft);
    padding: 14px 18px;
  }

  .cs-item:last-child { border-bottom: none; }

  .cs-item-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .cs-item-label {
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--ink-dim);
  }

  .cs-pin-btn {
    background: none;
    border: none;
    color: var(--ink-faint);
    cursor: pointer;
    font-size: 0.78rem;
    padding: 2px 4px;
    line-height: 1;
    transition: color 0.15s, transform 0.15s;
  }
  .cs-pin-btn:hover { color: var(--orange); transform: scale(1.15); }
  .cs-pin-btn.pinned { color: var(--orange); }

  .cs-code-wrap { position: relative; }

  .cs-code {
    background: var(--bg-inset);
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 12px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.76rem;
    line-height: 1.65;
    color: #d4d0c8;
    white-space: pre;
    overflow-x: auto;
  }

  .cs-code .tok-comment { color: var(--ink-faint); font-style: italic; }
  .cs-code .tok-kw { color: var(--orange); }
  .cs-code .tok-str { color: #9fb88a; }

  .cs-copy-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #141414;
    border: 1px solid var(--line);
    color: var(--ink-dim);
    font-size: 0.64rem;
    padding: 3px 9px;
    border-radius: 5px;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    transition: all 0.15s;
  }

  .cs-copy-btn:hover { border-color: var(--orange); color: var(--orange); }
  .cs-copy-btn.copied { border-color: var(--orange); color: var(--orange); background: var(--orange-soft); }

  /* ---------- Pinned strip ---------- */
  .cs-pinned-strip {
    max-width: 1180px;
    margin: 0 auto 36px;
    padding: 0 24px;
  }

  .cs-pinned-strip-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 0.7rem;
    color: var(--ink-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  .cs-pinned-strip-head::before { content: '★'; color: var(--orange); }

  .cs-pinned-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  .cs-pinned-card {
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 12px 14px;
  }

  .cs-pinned-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .cs-pinned-card-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ink);
  }

  .cs-pinned-card-source {
    font-size: 0.62rem;
    color: var(--orange);
    text-transform: uppercase;
  }

  /* ---------- Footer ---------- */
  .cs-footer {
    max-width: 1180px;
    margin: 40px auto 0;
    padding: 24px 24px 0;
    border-top: 1px solid var(--line);
    color: var(--ink-faint);
    font-size: 0.72rem;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cs-footer span.accent { color: var(--orange); }

  @media (max-width: 640px) {
    .cs-sections { grid-template-columns: 1fr; }
    .cs-header h1 { font-size: 1.9rem; }
    .cs-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); padding: 0 16px; }
    .cs-topbar-inner { flex-wrap: wrap; }
    .cs-topbar-meta { display: none; }
    .cs-header { padding: 36px 16px 24px; }
    .cs-detail { padding: 0 16px; }
    .cs-pinned-strip { padding: 0 16px; }
  }
`;

function highlightCode(code) {
  // Minimal, safe-ish token highlight: comments only, rest stays plain.
  return code.split("\n").map((line, i) => {
    const commentMatch = line.match(/(\/\/.*$|#.*$)/);
    if (commentMatch && commentMatch.index !== undefined) {
      const before = line.slice(0, commentMatch.index);
      const comment = line.slice(commentMatch.index);
      return (
        <span key={i}>
          {before}
          <span className="tok-comment">{comment}</span>
          {"\n"}
        </span>
      );
    }
    return <span key={i}>{line + "\n"}</span>;
  });
}

function CodeBlock({ code, copyKey, onCopy, copiedKey }) {
  const isCopied = copiedKey === copyKey;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    onCopy(copyKey);
  };

  return (
    <div className="cs-code-wrap">
      <pre className="cs-code">{highlightCode(code)}</pre>
      <button className={`cs-copy-btn${isCopied ? " copied" : ""}`} onClick={handleCopy}>
        {isCopied ? "✓ copied" : "copy"}
      </button>
    </div>
  );
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function CheatSheet() {
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);
  const [pinned, setPinned] = useState({}); // key -> { sheetId, sheetTitle, label, code }
  const searchRef = useRef(null);

  useEffect(() => {
    if (!copiedKey) return;
    const t = setTimeout(() => setCopiedKey(null), 1500);
    return () => clearTimeout(t);
  }, [copiedKey]);

  // Cmd/Ctrl+K focuses search
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && active) {
        setActive(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const totalSnippets = useMemo(
    () =>
      cheatsheets.reduce(
        (sum, s) => sum + s.sections.reduce((a, sec) => a + sec.items.length, 0),
        0
      ),
    []
  );

  const filteredSheets = useMemo(() => {
    if (!query.trim()) return cheatsheets;
    const q = query.toLowerCase();
    return cheatsheets
      .map((sheet) => {
        const titleMatch = sheet.title.toLowerCase().includes(q);
        const matchedSections = sheet.sections
          .map((sec) => {
            const items = sec.items.filter(
              (it) =>
                it.label.toLowerCase().includes(q) ||
                it.code.toLowerCase().includes(q) ||
                sec.heading.toLowerCase().includes(q)
            );
            return { ...sec, items };
          })
          .filter((sec) => sec.items.length > 0);

        if (titleMatch) return sheet;
        if (matchedSections.length > 0) return { ...sheet, sections: matchedSections, _filtered: true };
        return null;
      })
      .filter(Boolean);
  }, [query]);

  const sheet = active ? cheatsheets.find((s) => s.id === active) : null;

  function togglePin(sheetId, sheetTitle, label, code) {
    const key = `${sheetId}::${label}`;
    setPinned((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { sheetId, sheetTitle, label, code };
      }
      return next;
    });
  }

  const pinnedList = Object.entries(pinned);

  function jumpTo(heading) {
    const el = document.getElementById(`cs-sec-${slugify(heading)}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <style>{styles}</style>
      <div className="cs-root">
        <div className="cs-topbar">
          <div className="cs-topbar-inner">
            <div className="cs-dots">
              <span className="cs-dot" />
              <span className="cs-dot" />
              <span className="cs-dot live" />
            </div>
            <div className="cs-brand">
              dev<span>/</span>cheatsheets
            </div>
            <div className="cs-search-wrap">
              <span className="cs-search-icon">⌕</span>
              <input
                ref={searchRef}
                className="cs-search"
                placeholder="Search snippets, e.g. useEffect, $lookup..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (active) setActive(null);
                }}
              />
              <span className="cs-search-kbd">⌘K</span>
            </div>
            <div className="cs-topbar-meta">
              <span className="cs-dot live" style={{ width: 6, height: 6 }} />
              {totalSnippets} snippets indexed
            </div>
          </div>
        </div>

        {!active ? (
          <>
            <div className="cs-header">
              <div className="cs-header-eyebrow">quick reference, zero fluff</div>
              <h1>Dev Cheat Sheets</h1>
              <p>
                Syntax, patterns, and the lines you always forget — organized by language and
                framework. Search across everything, pin what you use daily, copy in one click.
              </p>
              <div className="cs-header-stats">
                <div>
                  <div className="cs-stat-num">{cheatsheets.length}</div>
                  <div className="cs-stat-label">Languages</div>
                </div>
                <div>
                  <div className="cs-stat-num">{totalSnippets}</div>
                  <div className="cs-stat-label">Snippets</div>
                </div>
                <div>
                  <div className="cs-stat-num">{pinnedList.length}</div>
                  <div className="cs-stat-label">Pinned</div>
                </div>
              </div>
            </div>

            {pinnedList.length > 0 && (
              <div className="cs-pinned-strip">
                <div className="cs-pinned-strip-head">Pinned snippets</div>
                <div className="cs-pinned-grid">
                  {pinnedList.map(([key, p]) => (
                    <div className="cs-pinned-card" key={key}>
                      <div className="cs-pinned-card-top">
                        <span className="cs-pinned-card-label">{p.label}</span>
                        <span className="cs-pinned-card-source">{p.sheetTitle}</span>
                      </div>
                      <CodeBlock
                        code={p.code}
                        copyKey={`pin-${key}`}
                        copiedKey={copiedKey}
                        onCopy={setCopiedKey}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredSheets.length === 0 ? (
              <div className="cs-no-results">
                <div>No snippets match “{query}”.</div>
                <div className="cs-no-results-code">try a shorter term, e.g. "map" or "async"</div>
              </div>
            ) : (
              <div className="cs-grid">
                {filteredSheets.map((s) => {
                  const count = s.sections.reduce((a, sec) => a + sec.items.length, 0);
                  return (
                    <button
                      key={s.id}
                      className="cs-card"
                      onClick={() => {
                        setActive(s.id);
                        setQuery("");
                      }}
                    >
                      <div className="cs-card-top">
                        <div className="cs-card-icon">{s.icon}</div>
                        <div className="cs-card-ext">{s.ext}</div>
                      </div>
                      <div className="cs-card-title">{s.title}</div>
                      <div className="cs-card-tagline">{s.tagline}</div>
                      <div className="cs-card-footer">
                        <span className="cs-card-count">
                          {s._filtered ? `${count} matches` : `${count} snippets · ${s.sections.length} sections`}
                        </span>
                        <span className="cs-card-arrow">view →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="cs-footer">
              <span>
                press <span className="accent">⌘K</span> to search · click a card to open
              </span>
              <span>{cheatsheets.map((s) => s.ext).filter((v, i, a) => a.indexOf(v) === i).join("  ")}</span>
            </div>
          </>
        ) : (
          <div className="cs-detail">
            <div className="cs-detail-header">
              <button className="cs-back-btn" onClick={() => setActive(null)}>
                ← back
              </button>
              <div className="cs-card-icon">{sheet.icon}</div>
              <div className="cs-detail-title-wrap">
                <h2>{sheet.title}</h2>
                <p>{sheet.tagline}</p>
              </div>
              <div className="cs-detail-jump">
                {sheet.sections.map((sec) => (
                  <button key={sec.heading} className="cs-jump-pill" onClick={() => jumpTo(sec.heading)}>
                    {sec.heading}
                  </button>
                ))}
              </div>
            </div>

            <div className="cs-sections">
              {sheet.sections.map((sec) => (
                <div className="cs-section" key={sec.heading} id={`cs-sec-${slugify(sec.heading)}`}>
                  <div className="cs-section-heading">{sec.heading}</div>
                  {sec.items.map((item) => {
                    const pinKey = `${sheet.id}::${item.label}`;
                    const isPinned = !!pinned[pinKey];
                    return (
                      <div className="cs-item" key={item.label}>
                        <div className="cs-item-label-row">
                          <span className="cs-item-label">{item.label}</span>
                          <button
                            className={`cs-pin-btn${isPinned ? " pinned" : ""}`}
                            onClick={() => togglePin(sheet.id, sheet.title, item.label, item.code)}
                            title={isPinned ? "Unpin" : "Pin this snippet"}
                            aria-label={isPinned ? "Unpin snippet" : "Pin snippet"}
                          >
                            {isPinned ? "★" : "☆"}
                          </button>
                        </div>
                        <CodeBlock
                          code={item.code}
                          copyKey={`${sheet.id}-${item.label}`}
                          copiedKey={copiedKey}
                          onCopy={setCopiedKey}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="cs-footer">
              <span>
                <span className="accent">{sheet.title}</span> · {sheet.sections.reduce((a, sec) => a + sec.items.length, 0)} snippets
              </span>
              <span>esc to go back</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}