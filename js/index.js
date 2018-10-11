var app = {
    initialize: function () {
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function () {


        function initPushwoosh() {
            var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

            // Should be called before pushwoosh.onDeviceReady
            document.addEventListener('push-notification', function (event) {
                var notification = event.notification;
                // handle push open here
            });

            // Initialize Pushwoosh. This will trigger all pending push notifications on start.
            pushwoosh.onDeviceReady({
                projectid: "101718936258",
                appid: "914DB-1F5D7",
                serviceName: ""
            });

            pushwoosh.registerDevice(
                function (status) {
                    var pushToken = status.pushToken;
                },
                function (status) {
                }
            );
        }

        console.log(device.uuid);
        Keyboard.hideFormAccessoryBar(true);
        initPushwoosh();

        app.receivedEvent('deviceready');
    },
    receivedEvent: function (id) {
        document.addEventListener("offline", function () {
            const $download = localStorage.getItem("lstequipos");

            if (!$download) {
                navigator.notification.alert(
                    'Favor de conectarse y descargar la base de datos',  // message
                    function () { },          // Callback
                    'Precaución',            // title
                    'Ok'                  // buttonName
                );
            }

        }, false);

        document.addEventListener("online", function () {
            downloadLists(false);
        }, false);

        const $equipoFill = document.querySelector(".equipos-fill"),
            $codigoFill = document.querySelector(".codigos-fill"),
            $articuloFill = document.querySelector(".articulo-fill");

        let $lstEquipo, $lstCodigo,
            filtro = false;

        const BASE_URL = 'https://mirage-app-dev.s3-us-west-1.amazonaws.com/errCode/';


        function equipoTemplate($eq, $logo, $index, $local) {
            var image;

            if ($local) {
                image = `./img/logos/${$logo}`;
            } else {
                image = `${BASE_URL}logos/${$logo}`;
            }

            return (
                `<div class="eqElement bg-light position-relative" data-eq="${$eq}" data-img="${$logo}" data-id="${$index}"  data-local="${$local}">
                    <img src="${image}" width="180" height="auto" alt="" data-eq="${$eq}" data-img="${$logo}" data-id="${$index}" data-local="${$local}" />
                    <i class="fas fa-angle-right"></i>
                </div >`
            );
        }

        function codigoTemplate($cod, $index) {
            return (
                `<div class="codElement bg-light code" data-cod="${$cod}" data-id="${$index}">
                    <div data-cod="${$cod}" data-id="${$index}">${$cod}</div>
                    <i class="fas fa-angle-right"></i>
                </div>`
            );
        }

        function articuloTemplate($name, $cod, $equip, $desc, $sol) {
            var image;

            if ($equip.local) {
                image = `./img/equipos/${$equip.image}`;
            } else {
                image = `${BASE_URL}equipos/${$equip.image}`;
            }

            const $nameEquip = $name.replace(/_/gm, " "),
                $descripcion = $desc.replace(/(\r\n|\n|\r)/gm, "<br>"),
                $solucion = $sol.replace(/(\r\n|\n|\r)/gm, "<br>");

            return (
                `
                <div class="card-body">
                    <h4 class="card-title text-center text-uppercase font-weight-bold mb-3">${$nameEquip}</h4>
                    <div class="card-text">
                        <header class="position-relative mb-3">
                            <div class="artElement position-absolute">${$cod}</div>
                            <img src="${image}" width="100%" height="auto" alt="" />
                        </header>
                        <section>
                            <h4>Significado</h4>
                            <p>${ $descripcion}</p>
                        </section>
                        <section>
                            <h4>Puntos a revisar</h4>
                            <p>${ $solucion}</p>
                        </section>
                    </div>
                </div>`
            );
        }

        function createTemplate(HTMLString) {
            const $html = document.implementation.createHTMLDocument();
            $html.body.innerHTML = HTMLString;
            return $html.body.children[0];
        }

        async function getData(url) {
            const response = await fetch(url);
            const data = await response.json();

            if (Object.keys(data).length > 0) {
                return data;
            }
            throw new Error('No se encontró ningun resultado');
        }

        async function downloadLists(update) {

            $("#loadMe").modal({
                backdrop: "static", //remove ability to close modal with click
                keyboard: false, //remove option to close with keyboard
                show: true //Display loader!
            });

            if (update) {
                localStorage.removeItem("lstequipos");
                localStorage.removeItem("lstcodigos");
                localStorage.removeItem("lstequivalente");
            }

            $lstEquipo = await cacheExists("equipos");
            $lstCodigo = await cacheExists("codigos");
            $lstEquivalente = await cacheExists("equivalente");
            loadEquip();
        }

        async function cacheExists(elem) {
            const listName = `lst${elem}`;
            const $download = localStorage.getItem(listName);

            if ($download) {
                return JSON.parse($download);
            }

            const data = await getData(`https://bdcodigoerror.firebaseio.com/${elem}.json`);
            localStorage.setItem(listName, JSON.stringify(data));
            return data;
        }

        async function loadEquip() {
            try {

                $equipoFill.innerHTML = "";
                const $lstEq = Object.keys($lstEquipo), $lstDetail = Object.values($lstEquipo);

                $lstEq.forEach((elem, i) => {
                    if ($lstDetail[i].visible) {
                        const HTMLString = equipoTemplate(elem, $lstDetail[i].logo, i, $lstDetail[0].local);
                        const $rowElement = createTemplate(HTMLString);
                        $equipoFill.append($rowElement);
                    }
                });

                setTimeout(function (e) {
                    $("#loadMe").modal("hide");
                }, 1000);

            } catch (error) {
                console.log(error);
            }
        }

        async function loadCodigo($id) {
            try {
                if (!filtro) {
                    const $lstKy = Object.keys($lstCodigo)[$id];
                    if ($lstKy !== "mpt_indoor" && $lstKy !== "mpt_outdoor") {
                        const $lstCode = Object.keys(Object.values($lstCodigo)[$id]);
                        $lstCode.forEach((elem, index) => {
                            const HTMLString = codigoTemplate(elem, index);
                            const $rowElement = createTemplate(HTMLString);
                            $codigoFill.append($rowElement);
                        });
                        $codigoFill.scrollTop = 0;
                    }
                    else {
                        const $lstCode = Object.values($lstCodigo)[$id];
                        $lstCode.forEach((elem, i) => {
                            if (elem) {
                                const HTMLString = codigoTemplate(i, i);
                                const $rowElement = createTemplate(HTMLString);
                                $codigoFill.append($rowElement);
                            }
                        });
                        $codigoFill.scrollTop = 0;
                    }

                } else {
                    const $txtCodigo = document.getElementById("txtSearchCode").value;

                    $codigoFill.innerHTML = "";
                    const HTMLString = codigoTemplate($txtCodigo, $id);
                    const $rowElement = createTemplate(HTMLString);
                    $codigoFill.append($rowElement);
                    $codigoFill.scrollTop = 0;
                }

            } catch (error) {
                console.log(error);
            }
        }

        function filtroEquipo(value) {
            try {
                var $lstKeys = Object.keys($lstEquivalente),
                    $indexKey = 0,
                    $lstVals = Object.values($lstEquivalente);

                for (var i = 0; i < $lstKeys.length; i++) {
                    if ($lstKeys[i] == value) {
                        $indexKey = i;
                        break
                    }
                }

                $equipoFill.innerHTML = "";
                const $lstValue = Object.values($lstVals[$indexKey]);
                let count = 0;
                $lstValue.forEach((elem) => {
                    var $lst = Object.keys(elem);

                    $lst.forEach((title) => {
                        if (title in $lstEquipo) {
                            const HTMLString = equipoTemplate(title, $lstEquipo[title].logo, count, $lstEquipo[title].local);
                            const $rowElement = createTemplate(HTMLString);
                            $equipoFill.append($rowElement);
                            count++;
                        }
                    });
                });

            } catch (error) {
                console.log(error);
                // swal("", "No se pudo enlazar con el servidor, favor de intentarlo de nuevo", "warning");
            }
        }

        function loadArticulo($equipo, $codigo) {

            if (!filtro) {
                const $artTitle = Object.keys($lstCodigo)[$equipo.equipo];
                const $artEquipo = Object.values($lstCodigo)[$equipo.equipo];
                const $artCodigo = Object.values($artEquipo)[$codigo];
                const $artCode = Object.keys($artEquipo)[$codigo];

                const HTMLString = articuloTemplate($artTitle, $artCode, $equipo, $artCodigo.descrip, $artCodigo.solucion);
                const $rowElement = createTemplate(HTMLString);
                $articuloFill.innerHTML = "";
                $articuloFill.append($rowElement);
                $articuloFill.scrollTop = 0;

            } else {
                const $txtCodigo = document.getElementById("txtSearchCode").value;
                const $selectEq = document.querySelectorAll(".eqElement")[$codigo];
                const $lstEq = Object.keys($lstCodigo);
                const $lstIndex = $lstEq.findIndex((elem) => {
                    return elem == $selectEq.dataset.eq;
                });

                const $selectCode = Object.values($lstCodigo)[$lstIndex][$txtCodigo];

                const HTMLString = articuloTemplate($selectEq.dataset.eq, $txtCodigo, $equipo, $selectCode.descrip, $selectCode.solucion);
                const $rowElement = createTemplate(HTMLString);
                $articuloFill.innerHTML = "";
                $articuloFill.append($rowElement);
                $articuloFill.scrollTop = 0;
            }

        }

        function checkConnection() {
            var networkState = navigator.connection.type;

            var states = {};
            states[Connection.UNKNOWN] = 'Unknown';
            states[Connection.ETHERNET] = 'Ethernet';
            states[Connection.WIFI] = 'WiFi';
            states[Connection.CELL_2G] = 'Cell 2G';
            states[Connection.CELL_3G] = 'Cell 3G';
            states[Connection.CELL_4G] = 'Cell 4G';
            states[Connection.CELL] = 'Cell generic';
            states[Connection.NONE] = 'offline';

            return states[networkState];
        }

        const $txtSearch = document.getElementById("txtSearchCode");
        $txtSearch.addEventListener("keyup", async function (e) {
            if (e.target.value == "") {
                $("#loadMe").modal({
                    backdrop: "static", //remove ability to close modal with click
                    keyboard: false, //remove option to close with keyboard
                    show: true //Display loader!
                });
                await loadEquip();
            }
        });

        const $home = document.querySelector(".home"), $screenHome = new Hammer($home);
        const $equipo = document.querySelector(".equipos"), $screenEquipo = new Hammer($equipo);
        const $codigo = document.querySelector(".codigos"), $screenCodigo = new Hammer($codigo);
        const $articulo = document.querySelector(".articulo"), $screenArticulo = new Hammer($articulo);

        function moveScreen($sc1, $sc2, $action) {

            $sc2.classList.remove("is-hidden");
            if ($action === "fwd") {

                $sc1.classList.remove("is-center");
                $sc1.classList.add("is-left");

                $sc2.classList.remove("is-right");
                $sc2.classList.add("is-center");

            } else {

                $sc1.classList.remove("is-center");
                $sc1.classList.add("is-right");

                $sc2.classList.remove("is-left");
                $sc2.classList.add("is-center");

            }
            $sc1.classList.add("is-hidden");

        }

        $screenHome.on("tap", function (elem) {
            const $target = elem.target;

            if ($target.classList.contains("btnConsulta")) {
                downloadLists(false);
                moveScreen($home, $equipo, "fwd");
            }
        });

        $screenEquipo.on("tap", async function (elem) {
            const $target = elem.target;

            const $txtSearch = document.getElementById("txtSearchCode").value;
            if ($txtSearch === "") {
                filtro = false;
            }

            if ($target.classList.contains("btnMenu-update")) {
                const conexion = checkConnection();
                if (conexion !== "offline") {
                    downloadLists(true);
                }
                else {
                    navigator.notification.alert(
                        'Por el momento solo puede navegar en los datos descargados. Para actualizar la base de datos conectese a una red de internet.',  // message
                        downloadLists(false),          // Callback
                        'Advertencia',            // title
                        'Ok'                  // buttonName
                    );

                }
            }
            else if ($target.id == "btnSearchCode") {
                if ($txtSearch == "") {

                    navigator.notification.alert(
                        'Favor de capturar un código',  // message
                        function () { },          // Callback
                        'Un momento',            // title
                        'Ok'                  // buttonName
                    );
                }
                else {
                    filtro = true;
                    await filtroEquipo($txtSearch);
                }
            }
            else if ($target.parentElement.classList.contains("equipos-fill") || $target.parentElement.classList.contains("eqElement")) {
                const saveData = {
                    "equipo": $target.dataset.id,
                    "image": $target.dataset.img,
                    "local": $target.dataset.local
                }
                sessionStorage.setItem("equipo", JSON.stringify(saveData));

                if (!filtro) {
                    await loadCodigo($target.dataset.id);
                    window.scrollTo(0, - document.querySelector(".codigos .container-fluid").scrollHeight);
                    moveScreen($equipo, $codigo, "fwd");
                } else {
                    await loadArticulo(saveData, $target.dataset.id);
                    window.scrollTo(0, - document.querySelector(".articulo .container").scrollHeight);
                    moveScreen($equipo, $articulo, "fwd");
                }
            }
        });

        $screenCodigo.on("tap", async function (elem) {
            const $target = elem.target;

            if ($target.classList.contains("btnMenu-back")) {
                moveScreen($codigo, $equipo, "rew");
                $codigoFill.innerHTML = "";
            }
            else if ($target.parentElement.classList.contains("codigos-fill") || $target.parentElement.classList.contains("codElement")) {
                const $selEquipo = JSON.parse(sessionStorage.getItem("equipo"));
                await loadArticulo($selEquipo, $target.dataset.id);
                window.scrollTo(0, - document.querySelector(".articulo .container").scrollHeight);
                moveScreen($codigo, $articulo, "fwd");
            }
        });

        $screenArticulo.on("tap", function (elem) {
            const $target = elem.target;

            if ($target.classList.contains("btnMenu-back")) {
                if (!filtro) {
                    window.scrollTo(0, - document.querySelector(".codigos .container-fluid").scrollHeight);
                    moveScreen($articulo, $codigo, "rew");
                } else {
                    window.scrollTo(0, - document.querySelector(".articulo .container").scrollHeight);
                    moveScreen($articulo, $equipo, "rew");
                }
            }
        });

        document.addEventListener("backbutton", function () {

            if ($articulo.classList.contains("is-center")) {
                if (!filtro) {
                    moveScreen($articulo, $codigo, "rew");
                } else {
                    moveScreen($articulo, $equipo, "rew");
                }
            }
            else if ($codigo.classList.contains("is-center")) {
                moveScreen($codigo, $equipo, "rew");
                $codigoFill.innerHTML = "";
            }

        }, false);
    }
};
