function mytest(curr_page, total_pages, pageurl, base){
/*
const curr_page = parseInt('{{paginator.page}}');
const total_pages = parseInt('{{paginator.total_pages}}');
const pageurl = '{{page.url}}';
var baseurl = '{{site.baseurl}}';
*/

// step 1: find base url for the first page according to pageurl
var baseurl = base;
if (curr_page == 1){
    baseurl = baseurl + pageurl.replace("index.html", "");
}
else{
    baseurl = baseurl + pageurl.replace("page"+curr_page+"/index.html", "");
}

// step 2: create icon list
var pager_div = document.getElementById("pager-icon-col");
var mylist = document.createElement("ul");
mylist.setAttribute("id", "pager-icon-list");
pager_div.append(mylist);

// step 3: discuss four cases to and generate the corresponding tabel.
if (total_pages <= 3){
    for (var i = 1; i <= total_pages; i++){
      var flag = 0;
      var pgurl = baseurl;
      // find proper flag, pgurl, content
      if (i == curr_page){ 
        flag = 1; 
      }
      if (i != 1) { 
        pgurl = pgurl + "page" + i; 
      }
      content = i.toString();
      createIcon(flag, pgurl, content);
    }
  }
  else{
    if (curr_page <= 2){ // case 1: curr_page = 1 or 2, no first and pre icons
      for (var i = 1; i <= 3; i++){
        var flag = 0;
        var pgurl = baseurl;
        if (i == curr_page){
          flag = 1;
        }
        if (i != 1) { 
          pgurl = pgurl + "page" + i; 
        }
        content = i.toString();
        createIcon(flag, pgurl, content); // page 1,2,3
      }
      
      createIcon(0, baseurl+"page"+(curr_page+1), "&gt"); // page curr_page+1
      createIconText(baseurl+"page"+total_pages, "Last &raquo;"); // last page
    }
    else if (curr_page >= total_pages-1){ // case 2: curr_page = last or last-1, no last and next icons
      createIconText(baseurl, "&laquo; First");   // first page
      createIcon(0, baseurl+"page"+(curr_page-1), "&lt"); //  page curr_page-1
      
      for (var i = total_pages-2; i <= total_pages; i++){
        var flag = 0;
        if (i == curr_page){
          flag = 1;
        }
        var pgurl = baseurl + "page" + i; 
        content = i.toString();
        createIcon(flag, pgurl, content); // page last-2, last-1, last
      }
    }
    else{ // case 3: first/last, pre/next icons all exist, current page is in the center
      createIconText(baseurl, "&laquo; First");    // first page
      createIcon(0, baseurl+"page"+(curr_page-1), "&lt");   // curr_page-1

      for (var i = -1; i <= 1; i++){ // curr_page is always selected
        var flag = 0;
        if (i == 0){
          flag = 1;
        }
        var pgurl = baseurl + "page" + (curr_page+i); 
        content = (curr_page+i).toString();
        createIcon(flag, pgurl, content); // curr_page-1, curr_page, curr_page+1
      }

      createIcon(0, baseurl+"page"+(curr_page+1), "&gt");   // curr_page+1
      createIconText(baseurl+total_pages, "Last &raquo;");  // last page
    }
  }
}

function createIcon(flag, url, content){
    var mylist = document.getElementById("pager-icon-list");
    var x = document.createElement("li");
    x.style.display = "inline";
    mylist.appendChild(x);

    var a = document.createElement("a");
    a.setAttribute("href", url);
    x.appendChild(a);

    // create Icon class
    var mydiv = document.createElement('div');
    mydiv.style.display = "inline-block";
    mydiv.innerHTML = content;
    if (flag == 1){
        mydiv.className = "number-circle selected";
    }
    else{
        mydiv.className = "number-circle unselected";
    }
    a.appendChild(mydiv);
}

function createIconText(url, content){
    var mylist = document.getElementById("pager-icon-list");
    var x = document.createElement("li");
    //x.style.display = "inline";
    mylist.appendChild(x);

    var a = document.createElement("a");
    a.setAttribute("href", url);
    a.innerHTML = content;
    x.appendChild(a);
}
