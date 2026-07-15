// src/data/lessons.js — All lesson content and quiz questions

const loremContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet consectetur adipisci velit.

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore cum soluta nobis eligendi optio cumque nihil impedit quo minus.`

const loremExp = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'

const opts = [
  'Lorem ipsum dolor sit amet consectetur',
  'Sed do eiusmod tempor incididunt ut',
  'Ut enim ad minim veniam quis nostrud',
  'Duis aute irure dolor in reprehenderit'
]

const q = (n, text, ci) => ({
  question: `${n}. ${text}`,
  options: opts,
  correctIndex: ci,
  explanation: loremExp
})

export const LESSONS = [
  {
    id: 1,
    name: 'Hardcoded API Keys',
    content: loremContent,
    questions: [
      q(1, 'What is the primary security risk of storing an API key directly in source code?', 0),
      q(2, 'Where should API credentials ideally be stored in a web application?', 1),
      q(3, 'Which of the following best describes the risk of committing an API key to a public git repository?', 2),
      q(4, 'What should a developer do immediately upon discovering a hardcoded API key in production code?', 3),
      q(5, 'Which type of tool can automatically detect hardcoded secrets in a codebase before deployment?', 0),
      q(6, 'What is "key rotation" and why is it considered an important security practice?', 1),
      q(7, 'Why is it still dangerous to remove a hardcoded API key if it remains in git commit history?', 2),
      q(8, 'Which of the following is NOT a recommended practice for API key security?', 3),
      q(9, 'What does "least privilege" mean specifically in the context of API key permissions?', 0),
      q(10, 'How can an API key be restricted to help limit damage if it is compromised?', 1),
    ]
  },
  {
    id: 2,
    name: 'Environmental Variables',
    content: loremContent,
    questions: [
      q(1, 'What is the main purpose of an environment variable in application security?', 1),
      q(2, 'What file format is most commonly used to store local environment variables for development?', 2),
      q(3, 'Why should .env files always be excluded from version control systems?', 3),
      q(4, 'What does the .gitignore file accomplish in relation to environment variable files?', 0),
      q(5, 'Which of the following is the most secure way to pass database credentials to a running application?', 1),
      q(6, 'What is the primary security risk of logging environment variables in a production environment?', 2),
      q(7, 'Which Node.js object is used to access environment variables at application runtime?', 3),
      q(8, 'What is the purpose of a cloud secrets manager in modern deployment pipelines?', 0),
      q(9, 'What does the "12-Factor App" methodology state about application configuration?', 1),
      q(10, 'How should environment variable values differ between development and production environments?', 2),
    ]
  },
  {
    id: 3,
    name: 'Hashing Passwords',
    content: loremContent,
    questions: [
      q(1, 'What is the main purpose of hashing a password before storing it in a database?', 2),
      q(2, 'Why should MD5 no longer be used for password hashing in modern applications?', 3),
      q(3, 'What is a cryptographic "salt" in the context of password hashing?', 0),
      q(4, 'Which hashing algorithm is generally considered best practice for password storage today?', 1),
      q(5, 'What property makes bcrypt suitable for passwords but not for general-purpose data hashing?', 2),
      q(6, 'What is a "rainbow table" attack and how does it relate to password security?', 3),
      q(7, 'Why does bcrypt include a configurable cost factor (work factor)?', 0),
      q(8, 'What problem arises when two users share the same password and salting is not used?', 1),
      q(9, 'What is the fundamental difference between hashing and encrypting a password?', 2),
      q(10, 'Why is storing plain-text passwords classified as a critical security vulnerability?', 3),
    ]
  },
  {
    id: 4,
    name: 'Authentication vs Authorization',
    content: loremContent,
    questions: [
      q(1, 'What is the primary difference between authentication and authorization?', 0),
      q(2, 'Which of the following actions is an example of authentication?', 1),
      q(3, 'Which of the following actions is an example of authorization?', 2),
      q(4, 'What is multi-factor authentication (MFA) and why does it improve security?', 3),
      q(5, 'What does the principle of "least privilege" mean in the context of authorization?', 0),
      q(6, 'What is role-based access control (RBAC) and what problem does it solve?', 1),
      q(7, 'What is an access token and how does it relate to the authorization process?', 2),
      q(8, 'What is the key distinction between OAuth 2.0 and OpenID Connect?', 3),
      q(9, 'Why is broken access control consistently ranked in the OWASP Top 10?', 0),
      q(10, 'What is vertical privilege escalation and give an example of how it occurs?', 1),
    ]
  },
  {
    id: 5,
    name: 'Hashing vs Encryption',
    content: loremContent,
    questions: [
      q(1, 'What is the fundamental operational difference between hashing and encryption?', 1),
      q(2, 'Which cryptographic operation is possible with encryption but is intentionally impossible with hashing?', 2),
      q(3, 'What type of cryptography uses a single shared key for both encryption and decryption?', 3),
      q(4, 'What is the primary purpose of asymmetric (public-key) encryption?', 0),
      q(5, 'For which use case is hashing more appropriate than encryption?', 1),
      q(6, 'For which use case is encryption more appropriate than hashing?', 2),
      q(7, 'What is a "hash collision" and why does it represent a security problem?', 3),
      q(8, 'What is AES and what category of encryption algorithm does it represent?', 0),
      q(9, 'Why is SHA-256 considered significantly more secure than SHA-1?', 1),
      q(10, 'What role does a digital signature play in asymmetric cryptography?', 2),
    ]
  },
  {
    id: 6,
    name: 'SQL Injection',
    content: loremContent,
    questions: [
      q(1, 'What is SQL injection and at a high level how does it work?', 2),
      q(2, 'Which of the following input strings is most likely an attempt at SQL injection?', 3),
      q(3, 'What is a "prepared statement" (parameterized query) and how does it prevent SQL injection?', 0),
      q(4, 'What is "input validation" and how does it complement prepared statements?', 1),
      q(5, 'What types of damage can a successful SQL injection attack cause to an application?', 2),
      q(6, 'What does seeing the database error "syntax error near --" in a web app response indicate?', 3),
      q(7, 'What is "blind SQL injection" and why is it more difficult to detect?', 0),
      q(8, 'How does using an ORM (Object-Relational Mapper) help reduce SQL injection risk?', 1),
      q(9, 'What does the principle of "least privilege" mean specifically for database user accounts?', 2),
      q(10, 'Under which OWASP Top 10 category does SQL injection fall?', 3),
    ]
  },
  {
    id: 7,
    name: 'Cross-Site Scripting',
    content: loremContent,
    questions: [
      q(1, 'What is Cross-Site Scripting (XSS) and what makes it dangerous?', 0),
      q(2, 'What is the key difference between reflected XSS and stored (persistent) XSS?', 1),
      q(3, 'What is DOM-based XSS and how does it differ from other XSS types?', 2),
      q(4, 'How does a Content Security Policy (CSP) header help mitigate XSS attacks?', 3),
      q(5, 'What is "output encoding" and how does it prevent XSS from executing?', 0),
      q(6, 'Why are HttpOnly cookies an important defense against the impact of XSS?', 1),
      q(7, 'What is "session hijacking" and how can XSS enable this type of attack?', 2),
      q(8, 'What does it mean to "sanitize user input" in the context of preventing XSS?', 3),
      q(9, 'Which specific HTML special characters must be encoded to prevent XSS in web output?', 0),
      q(10, 'What is the X-XSS-Protection HTTP header and is it still recommended for modern browsers?', 1),
    ]
  },
  {
    id: 8,
    name: 'Passwords vs Passkeys',
    content: loremContent,
    questions: [
      q(1, 'What is a passkey and what is its fundamental difference from a traditional password?', 3),
      q(2, 'What underlying cryptographic technology do passkeys rely on for security?', 0),
      q(3, 'What is "phishing resistance" and why do passkeys provide it while passwords do not?', 1),
      q(4, 'Where are the cryptographic credentials for passkeys stored — on the server or the device?', 2),
      q(5, 'What is WebAuthn and what is its relationship to passkeys?', 3),
      q(6, 'What happens to a passkey if a user permanently loses access to their authenticator device?', 0),
      q(7, 'What specific weaknesses of passwords make passkeys a more secure authentication method?', 1),
      q(8, 'What is a "credential stuffing" attack and why are passkeys inherently immune to it?', 2),
      q(9, 'What role does biometric verification play in the passkey authentication flow?', 3),
      q(10, 'What is the FIDO2 standard and how does it relate to the development of passkeys?', 0),
    ]
  }
]
