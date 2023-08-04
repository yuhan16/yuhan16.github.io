# Personal Blog repo

This repo is for personal blog website. 

## Design source
The website design is borrowed from the following three websites:
- [DAIR lab](https://dair.seas.upenn.edu/)
- [Lei Mao's Log Book](https://leimao.github.io/)
- [Lil'Log](https://lilianweng.github.io/) 

## Some specifications
There are two general layouts for the current blog:
- `singlecard`: all content is contained in a single card. Used for home, categories, tags, etc.
- `multicard`: multiple cards. Used for blog post pages.

For the file format:
- We always use `png` as the logo image.
- We always use `png` as the content image and `gif` as the content animation.

Front matter variables
- `page.label` is to create category/tag blocks for pagination.

## Branch specifications
Each branch is the version of the past website. Each branch is the **final** version of the development. Each branch corresponds to a release with tag `vx.0`. In each release, the generated `_site` is included for reference.
- `v1` is borrowed from [Freshman](https://github.com/yulijia/freshman)
- `v2` is self designed based on double column layout of [Freshman](https://github.com/yulijia/freshman)
- `main` is the current version, no `_site` directory.

When the development of a certain version ends, create a new branch that includes `_site` directory and the corresponding release. Easy for future reference. 