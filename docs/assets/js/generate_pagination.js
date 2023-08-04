function createPaginationIconList(curr, total_pages, pageurl) {
    // 1. get baseurl for paginations
    let baseurl = "";
    if (curr == 1){
        baseurl = pageurl.replace("index.html", "");
    }
    else{
        baseurl = pageurl.replace("page"+curr+"/index.html", "");
    }

    // 2. add pagination number icons
    icon_div = document.getElementById("pagination-icon-container");
    // 2.a when there is only one page in total
    if (total_pages == 1){
        // only draw one icon
        let a = createPaginationIcon(1, pageurl);
        a.classList.add("pagination-icon-selected");
        icon_div.appendChild(a);
        return
    }

    // 2.b plot icons before curr
    let pre = curr - 1
    let nxt = curr + 1
    if (pre > 0){   // otherwise, pre is 1
        if (pre - 1 > 2){
            // add 1, ..., and pre
            let a = createPaginationIcon(1, baseurl);
            icon_div.appendChild(a);
            
            a = document.createElement("span");
            a.classList.add("pagination-icon");
            a.innerHTML = "...";
            a.style.backgroundColor = "#f5f5f5";
            icon_div.appendChild(a);

            a = createPaginationIcon(pre, baseurl+'page'+pre+"/");
            icon_div.appendChild(a);
        }
        else{
            for (let j = 1; j <= pre; j++){
                // add j
                let url = (j == 1) ? baseurl : baseurl+'page'+j+"/";
                let a = createPaginationIcon(j, url);
                icon_div.appendChild(a);
            }
        }
    }

    // 2.c add curr icon
    let a = createPaginationIcon(curr, pageurl);
    a.classList.add("pagination-icon-selected");
    icon_div.appendChild(a)

    // 2.d plot icons after curr
    if (nxt < total_pages+1){     // otherwise, nxt is total_page
        if (nxt + 2 < total_pages){
            // add nxt, ..., total_page
            let a = createPaginationIcon(nxt, baseurl+'page'+nxt+"/");
            icon_div.appendChild(a);
            
            a = document.createElement("span");
            a.classList.add("pagination-icon");
            a.innerHTML = "...";
            a.style.backgroundColor = "#f5f5f5";
            icon_div.appendChild(a);
            
            a = createPaginationIcon(total_pages, baseurl+'page'+total_pages+"/");
            icon_div.appendChild(a);
        }
        else{
            for (let j = nxt; j <= total_pages; j++){
                // add j
                let a = createPaginationIcon(j, baseurl+'page'+j+"/");
                icon_div.appendChild(a);
            }
        }
    }

}

function createPaginationIcon(page_num, page_url) {
    // return object, append in the previous function.
    let a = document.createElement("a")
    a.innerHTML = page_num
    a.classList.add("pagination-icon")
    a.setAttribute("href", page_url)
    return a
}