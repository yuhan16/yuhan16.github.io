// event listener to publication page
function handleButtonClick() {
    alert(this)
    let name = 'p.' + this.innerText.toLowerCase();
    let x = this.parentNode.parentNode.querySelector(name);
    x.classList.toggle('open');
    alert("hhh")
}

function add_click_event(class_name) {
    const buttons = document.querySelectorAll(class_name);
	alert(buttons.length);
    buttons.forEach(button => {
        button.addEventListener('click', handleButtonClick());
    });
}

//document.body.addEventListener("scriptExecuted", function() {
document.addEventListener("DOMContentLoaded", function() {
//window.addEventListener("load", () =>{
    //add_click_event('a.abs');
    //add_click_event('a.bib');
    const abs_buttons = document.querySelectorAll("a.abs");
    //alert(abs_buttons.length)
    abs_buttons.forEach(button => {
        button.addEventListener('click', function() {
            //let name = 'p.' + this.innerText.toLowerCase();
            let name = "p.abs";
            //alert(this)
            let x = this.parentNode.parentNode.querySelector(name);
            x.classList.toggle('open');
        });
    });

    const bib_buttons = document.querySelectorAll("a.bib");
    bib_buttons.forEach(button => {
        button.addEventListener('click', function() {
            //let name = 'p.' + this.innerText.toLowerCase();
            let name = "p.bib";
            let x = this.parentNode.parentNode.querySelector(name);
            x.classList.toggle('open');
        });
    });

});

/*
document.addEventListener("DOMContentLoaded", () => {
    alert('fff')
	const abs_buttons = document.querySelectorAll('a.abs');
	alert(abs_buttons.length);
    abs_buttons.forEach(button => {
        button.addEventListener('click', handleButtonClick);
	});
	
	const bib_buttons = document.querySelectorAll('a.bib');
    bib_buttons.forEach(button => {
       button.addEventListener('click', handleButtonClick);
    });
});
*/