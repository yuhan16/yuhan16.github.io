// function name cannot be the same as the script name
function generatePubDiv(data, div_id){
    let all_pubs = document.getElementById(div_id);

    for (let i = 0; i<data.length; i++){
        let pub = data[i];
        let pub_container = document.createElement('div');
        all_pubs.appendChild(pub_container)
        pub_container.setAttribute("class", "pub-container pub-meta");   // set padding and margin
        
        // make title
        let title = document.createElement("h4");
        pub_container.appendChild(title)
        //title.setAttribute("class", "pub-meta");
        title.innerHTML = pub.title;

        // make author
        let authors = document.createElement("p");
        pub_container.appendChild(authors);
        //authors.setAttribute("class", "pub-meta");
        for (let j = 0; j < pub.authors.length; j++){
            if (pub.authors[j] === pub.hightlight) {
                
                authors.innerHTML += "<b>"+pub.hightlight+"</b>";
            }
            else{
                authors.innerHTML += pub.authors[j];
            }

            if (j < pub.authors.length-1){
                authors.innerHTML += ", ";
            }
        }

        // make journal
        let journal = document.createElement("p");
        pub_container.appendChild(journal);
        //journal.setAttribute("class", "pub-meta"); 
        journal.innerHTML = "<em>"+pub.journal+"</em>";
        
        // make icons
        let icon_container = document.createElement("div");
        pub_container.appendChild(icon_container);
        icon_container.style.display = "flex"; // padding or other settings, or set css ???
        if (pub.pdf){
            let pdf = document.createElement("a");
            icon_container.appendChild(pdf);
            pdf.setAttribute("class", "pub-icon");
            pdf.setAttribute("href", pub.pdf);
            pdf.innerHTML = "PDF";
        }
        if (pub.abs){
            let abs = document.createElement("a");
            icon_container.appendChild(abs);
            abs.setAttribute("class", "abs pub-icon");
            abs.innerHTML = "ABS";

            let abs_box = document.createElement("p");
            pub_container.appendChild(abs_box);
            abs_box.setAttribute("class", "abs pub-content hidden");
            abs_box.innerHTML = pub.abs;
        }
        if (pub.bib){
            let bib = document.createElement("a");
            bib.setAttribute("class", "bib pub-icon");
            icon_container.appendChild(bib);
            bib.innerHTML = "BIB";

            let bib_box = document.createElement("p");
            pub_container.appendChild(bib_box);
            bib_box.setAttribute("class", 'bib pub-content hidden')
            bib_box.innerHTML = pub.bib
        }
        if (pub.code){
            let code = document.createElement("a");
            code.setAttribute("class", "pub-icon");
            icon_container.appendChild(code);
            code.setAttribute("href", pub.code);
            code.innerHTML = "CODE";
        }
        if (pub.video){
            let video = document.createElement("a");
            icon_container.appendChild(video);
            video.setAttribute("class", "pub-icon");
            video.setAttribute("href", pub.video);
            video.innerHTML = "VIDEO";
        }
    }
}


function addIconClickEvent(){
    //debugger;
    const abs_buttons = document.querySelectorAll("a.abs");
    abs_buttons.forEach(button => {
        button.addEventListener('click', function() {
            let x = this.parentNode.parentNode.querySelector("p.abs");
            x.classList.toggle('open');
        });
    });

    const bib_buttons = document.querySelectorAll("a.bib");
    bib_buttons.forEach(button => {
        button.addEventListener('click', function() {
            let x = this.parentNode.parentNode.querySelector("p.bib");
            x.classList.toggle('open');
        });
    });
}


async function fetchPubJSON() {
	let response = await fetch("/assets/js/pub.json");
	let data = await response.json();
    let promise = new Promise(function(resolve, reject) {
        generatePubDiv(data.published, "published");
        generatePubDiv(data.preprints, "preprint");
        //resolve("done");
      });
    promise.then(addIconClickEvent())
}


fetchPubJSON();

/*
fetch("/assets/js/pub.json")
    .then(response => response.json())
    .then(data => {
        // generate publication content
        generatePubDiv(data.published, "published");
        generatePubDiv(data.preprints, "preprint");
    })
    //.then(addIconClickEvent())
    .catch(error => {alert(error);});
*/