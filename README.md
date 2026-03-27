# pkg-risk

A CLI tool that analyzes installed packages in your Node.js project and displays a grouped table showing the update risk for each dependency.

## Installation

```bash
npm install -g pkg-risk
```

## Usage

Run the following command inside your Node.js project folder:

```bash
pkg-risk check
```

### Output

Packages are grouped by priority and displayed in a table:

| Semver     | Name    | Local Version | LTS Version | Comment                             |
|------------|---------|---------------|-------------|-------------------------------------|
| DEPRECATED | axios   | 0.21.0        | 1.13.6      | Critical security vulnerability...  |
| MAJOR      | lodash  | 3.0.0         | 4.17.23     | HIGH RISK                           |
| MINOR      | moment  | 2.29.0        | 2.30.1      | MEDIUM RISK                         |
| PATCH      | ms      | 2.1.2         | 2.1.3       | LOW RISK                            |
| UP TO DATE | rxjs    | 7.8.2         | 7.8.2       | NO ACTION NEEDED                    |

A summary is displayed at the end with the count of each group.

### Semver risk levels

| Level      | Color     | Description                                                    |
|------------|-----------|----------------------------------------------------------------|
| DEPRECATED | 🔴 Red    | Package is explicitly marked as deprecated by its author       |
| MAJOR      | 🔴 Red    | Major version available — high risk, possible breaking changes |
| MINOR      | 🟡 Yellow | Minor version available — medium risk update                   |
| PATCH      | 🟢 Green  | Patch version available — low risk update                      |
| UP TO DATE | 🔵 Blue   | Package is up to date                                          |

## Why pkg-risk?

Unlike `npm outdated`, **pkg-risk** focuses on risk assessment:

- Detects packages **explicitly deprecated** by their author with the deprecation message
- Classifies each package by **semver risk level** so you can prioritize updates
- Helps you make **informed decisions** before updating dependencies

## Contributing

Contributions are welcome. Feel free to open an issue or submit a pull request on [GitHub](https://github.com/jondeldev/pkg-risk).

## License

[MIT](LICENSE)
