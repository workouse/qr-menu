# Contributing to QR Menu

First off, thanks for taking the time to contribute! 🎉 

The following is a set of guidelines for contributing to this project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

By participating in this project, you are expected to uphold our code of conduct. Please treat all contributors with respect.

## License Restriction (Important)

Please note that this project is licensed under the **CC BY-NC 4.0** license. This means it is for **Personal / Non-Commercial Use Only**. 

By contributing to this repository, you agree that your contributions will be licensed under the same CC BY-NC 4.0 license.

## How Can I Contribute?

### Reporting Bugs

- Ensure the bug was not already reported by searching on GitHub under Issues.
- If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

- Open a new issue with the label `enhancement`.
- Provide a clear and detailed description of the feature you want.
- Explain why this enhancement would be useful to most users.

### Pull Requests

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Local Development Setup

This project is a monorepo managed by `pnpm`.

1. Ensure you have the correct Node.js version installed (use `nvm use`).
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.dist` to `.env` and fill in the required environment variables (e.g., Auth0 configurations).
4. Run the development server:
   ```bash
   pnpm dev
   ```

Thank you!
