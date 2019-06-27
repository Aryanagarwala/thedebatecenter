function get(path, restype, callback){
    const xhr = new XMLHttpRequest();
    const url = path;
    xhr.responseType = restype;
    xhr.onreadystatechange = function(){
        if(xhr.readyState===XMLHttpRequest.DONE){
            callback(xhr);
        }
    };
    xhr.open('GET', url);
    xhr.send();
}
function hidelogin(){
    if(localStorage.getItem('logged')==='1'){
        document.getElementById("login").style.display = "none";
        document.getElementById("userh").style.display = "inline-block";
        document.getElementById("userh").innerHTML = localStorage.getItem("user").toUpperCase();
    }
}
function logout(){
    localStorage.setItem('user',' ');
    localStorage.setItem('logged', 0);
    if(localStorage.getItem('user')===' '){
        window.location.href = "/index.html";
    }
}
//checks if the user is logged in and returns a window alert if not 
function checklogged(){
    if(localStorage.getItem("logged")==="1"){
        return true;
    }
    else{
        return false;
    }
}