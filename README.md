# Export To Hugo

Provide Strapi v5 to generate your hugo. This plugin is open to everyone and everyone can contribute and modify it. The future of Export To Hugo is decided by each of you.

## Thanks

This project thanks Cursor for his help.

## Version

Strapi version: V5 (The following tutorial is based on 5.13.1)

Hugo version: Not Sure. (The following tutorial is based on hugo_extended_0.147.4)

## Directory

You need to create a project directory. 

There are two folders under the project root directory, one is `hugo` and the other is `strapi`. You can't change their names.

## Install

```javascript
git init
```

### Hugo

In the following examples, I use the `hugo_extended_0.147.4` as a demonstration.

```javascript
.\hugo.exe new site hugo
```

If you have your own template, you can install it via git submodule.

Or you can install your template via any method supported by hugo.

```javascript
git submodule add https://YOUR_THEME_URL.git hugo/themes/YOUR_THEME_DIRECTORY
```

### Strapi

Run the following command in a terminal:

```javascript
npx create-strapi@latest strapi
```

Here is an example, You can set them according to your needs.

```javascript
? Please log in or sign up. (Use arrow keys)
> Login/Sign up
? Please log in or sign up. Skip
? Do you want to use the default database (sqlite) ? (Y/n)
? Do you want to use the default database (sqlite) ? Yes
? Start with an example structure & data? (y/N)
? Start with an example structure & data? No
? Start with Typescript? (Y/n) n
? Start with Typescript? No
? Install dependencies with npm? (Y/n)
? Install dependencies with npm? Yes
? Initialize a git repository? (Y/n) n
? Initialize a git repository? No

```

### Export To Hugo

Run the following command in a terminal:

```javascript
cd .\strapi\
npm i strapi-export-to-hugo
```

Start Strapi

```javascript
yarn develop
```

## How To Use

### Generating Content-Type

After logging into Strapi, on the left side of the menu bar, select export-to-hugo.

Select Content-Type Generator.

After Clicking, you will be prompted that the creation is successful. Then return to Content Manager to see the automatically generated Content-Type.

Then you can complete all your Hugo content, just in Strapi.

### Generate Gugo Files

On the left side of the menu bar, select export-to-hugo.

Click the second button to update the hugo file.

## Development

### Local Publishing

In export-to-hugo directory

```javascript
yarn build
yalc publish
```

In strapi directory

```javascript
npx yalc add --link strapi-export-to-hugo
yarn install
yalc update strapi-export-to-hugo
yarn develop
```
