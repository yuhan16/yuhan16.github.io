var pg = parseInt('{{ paginator.page }}');
      var pg_total = parseInt('{{paginator.total_pages}}');
      const pg_col = 7;   // number of table cells for pagination display
      //const baseurl = '{{site.baseurl}}' + "/blog/";
      var baseurl = '{{site.baseurl}}';
      var pgurl = '{{page.url}}';
document.write(pgurl);
      if (pg == 1){
        baseurl = baseurl + pgurl.replace("index.html", "");   
      }
      else{
        baseurl = baseurl + pgurl.replace("page"+pg+"/index.html", ""); 
      }

      if (pg_total <= 3){
        for (var i = 1; i <= pg_total; i++){
          var col = pg_col - pg_total + i;
          var flag = 1;
          var pgurl = baseurl;
          // find proper flag, pgurl, content
          if (i == pg){ 
            flag = 0; 
          }
          if (i != 1) { 
            pgurl = pgurl + "page" + i; 
          }
          content = i.toString();
          createPageIcon(flag, content, col, pgurl);
        }
      }
      else{
        if (pg <= 2){ // case 1: pg = 1 or 2, no first and pre icons
          for (var i = 1; i <= 3; i++){
            var col = pg_col - 5 + i;
            var flag = 1;
            var pgurl = baseurl;
            if (i == pg){
              flag = 0;
            }
            if (i != 1) { 
              pgurl = pgurl + "page" + i; 
            }
            content = i.toString();
            createPageIcon(flag, content, col, pgurl); // plot page 1,2,3
          }
          createPageIcon(flag, "&gt", 6, baseurl+"page"+4); // plot next icon
          createPageIconText("Last &raquo;", 7, baseurl +"page"+pg_total); // plot last icon
        }
        else if (pg >= pg_total-1){ // case 2: pg = last or last-1, no last and next icons
          for (var i = 1; i <= 3; i++){
            var col = pg_col - 3 + i;
            var flag = 1;
            if (i == pg){
              flag = 0;
            }
            var pgurl = baseurl + "page" + (pg_total-3+i); 
            content = i.toString();
            createPageIcon(flag, content, col, pgurl); // plot page 1,2,3
          }
          createPageIcon(1, "&lt", 4, baseurl+"page"+(pg_total-3)); // plot pre icon
          createPageIconText("&laquo; First", 3, baseurl); // plot first icon
        }
        else{ // case 3: first/last, pre/next icons all exist, current page is in the center
          var pg_pre = parseInt('{{ paginator.previous_page }}');
          var pg_next = parseInt('{{ paginator.next_page }}');
          createPageIcon(1, pg_pre.toString(), 3, baseurl+"page"+pg_pre); // plot page 1,2,3
          createPageIcon(0, pg_.toString(), 4, baseurl+"page"+pg);
          createPageIcon(1, pg_next.toString(), 5, baseurl+"page"+pg_next);

          createPageIcon(1, "&lt", 2, baseurl+"page"+(pg_pre-1));
          createPageIconText("&laquo; First", 1, baseurl);

          createPageIcon(1, "&gt", 6, baseurl+"page"+(pg_next+1));
          createPageIconText("Last &raquo;", 7, baseurl+pg_total);
        }
      }

      function createPageIcon(flag, content, col, pgurl){
        // flag = 0 => current page, flag = 1 => other page
        var a_id = "td" + col;
        var a_td = document.getElementById(a_id);
        // assign url to the link
        a_td.setAttribute("href", pgurl);
        // create new icon div
        var mydiv = document.createElement('div');
        mydiv.innerHTML = content;
        if (flag == 0){
          mydiv.className = "number-circle current-page";
        }
        else{
          mydiv.className = "number-circle other-page";
        }
        // append new div to the table cell
        a_td.appendChild(mydiv);
      }

      function createPageIconText(content, col, pgurl){
        var a_id = "td" + col;
        var a_td = document.getElementById(a_id);
        a_td.setAttribute("href", pgurl);
        a_td.innerHTML = content;
      }
      function hello(arg){
          document.write("hello"+arg);
      }