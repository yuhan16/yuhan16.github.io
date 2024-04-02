import os
if not os.path.exists('tmp-tag-pages'):
    os.mkdir('tmp_tag_pages')

# get tags from jekyll-test post
tags = ['jekyll', 'test', 'css', 'web', 'templating', 'html', 'mathjax', 'tutorial', 'static web', 'dynamic web', 'php', 'ssg', 'static site generator', 'github pages', 'notes', 'math', 'git', 'rl', 'collocation', 'trajectory optimization', 'optimization', 'control',]

for tag in tags:
    fname = 'tmp_tag_pages/' + tag.replace(" ", "-") + '.md'
    f = open(fname, 'w')
    
    # write files
    f.write('---\n')
    
    f.write('layout: blog-pagination\n')
    f.write(f'title: {tag}\n')
    f.write(f'permalink: /tags/{tag.replace(" ", "-")}/\n')
    f.write('label: tags\n')
    
    f.write('pagination:\n')
    f.write('  enabled: true\n')
    f.write(f'  tag: {tag}\n')
    f.write(f'  permalink: /page:num/\n')
    
    f.write('---\n')