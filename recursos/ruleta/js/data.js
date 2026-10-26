/* Datos del juego: preguntas, categorías y desafíos del Chef Comodín.
   Para cambiar o agregar contenido editá solo este archivo (ver README). */
(function () {
  var CATS = [
    { id: "fv", name: ["Frutas", "y verduras"], full: "Frutas y verduras", icon: "🍎", color: "#c8402f" },
    { id: "ag", name: ["Agua", "y bebidas"], full: "Agua y bebidas", icon: "💧", color: "#1d6fb8" },
    { id: "co", name: ["Comidas", "saludables"], full: "Comidas saludables", icon: "🍽️", color: "#b86e00" },
    { id: "cm", name: ["Compras", "y alimentos"], full: "Compras y alimentos", icon: "🛒", color: "#7b4a9e" },
    { id: "hi", name: ["Higiene", "y cuidados"], full: "Higiene y cuidados", icon: "🧼", color: "#12897d" },
    { id: "mo", name: ["Movimiento", "y hábitos"], full: "Movimiento y hábitos", icon: "🏃", color: "#4f8a1f" }
  ];

  // La primera opción de cada pregunta es la correcta; se mezclan al mostrarlas.
  var Q = [
    // Frutas y verduras
    { c: "fv", q: "¿Cada cuánto conviene comer frutas y verduras?", o: ["Todos los días", "Solo los domingos", "Solo cuando hace calor"], e: "Conviene comer frutas y verduras todos los días, de distintos tipos y colores." },
    { c: "fv", q: "¿Cuál de estos platos tiene más colores?", o: ["Ensalada de zanahoria, remolacha y repollo", "Fideos blancos solos", "Pan con queso"], e: "Cuantos más colores tiene el plato, más variedad de vitaminas y minerales." },
    { c: "fv", q: "¿Qué es una buena opción de postre todos los días?", o: ["Una fruta", "Una porción de torta", "Un alfajor"], e: "La fruta es un postre sencillo, rico y saludable para todos los días." },
    { c: "fv", q: "¿Cuándo suelen ser más baratas y sabrosas las frutas y verduras?", o: ["Cuando son de estación", "Cuando vienen en bandeja", "Cuando están fuera de temporada"], e: "Las frutas y verduras de estación son más baratas, frescas y sabrosas." },
    { c: "fv", q: "¿Cómo podemos sumar más verduras a las comidas?", o: ["Ponerlas en tortillas, guisos y rellenos", "Sacarlas del plato", "Comerlas solo en fiestas"], e: "Las verduras se pueden agregar a muchas preparaciones de todos los días." },
    { c: "fv", l: 2, q: "¿Cuántas porciones de frutas y verduras conviene comer por día, según las Guías Alimentarias?", o: ["Al menos 5 porciones", "1 porción", "2 porciones, solo en el almuerzo"], e: "Se recomienda llegar a 5 porciones por día entre frutas y verduras, de distintos tipos y colores." },
    { c: "fv", l: 2, q: "¿Verdadero o falso? Un vaso de jugo exprimido reemplaza a la fruta entera.", o: ["Falso: la fruta entera aporta fibra y llena más", "Verdadero: es exactamente lo mismo", "Verdadero: tiene más vitaminas que la fruta"], e: "Al exprimir la fruta se pierde la fibra, y es fácil tomar mucho más azúcar sin darnos cuenta. Conviene la fruta entera." },
    { c: "fv", l: 2, q: "¿Cómo conviene cocinar las verduras para conservar más vitaminas?", o: ["Al vapor o al horno, con poco agua", "Hervidas mucho tiempo en bastante agua", "Fritas en aceite abundante"], e: "Con poca agua y poco tiempo de cocción se pierden menos vitaminas y minerales." },
    { c: "fv", l: 2, q: "En el plato saludable, ¿qué parte del plato ocupan las verduras?", o: ["La mitad del plato", "Un cuarto del plato", "Una cucharada"], e: "Las verduras ocupan la mitad del plato. El otro cuarto son cereales o legumbres y el último, carnes o huevo." },
    { c: "fv", l: 3, q: "Para aprovechar mejor el hierro de las lentejas, ¿qué conviene sumar a la comida?", o: ["Jugo de limón o una fruta cítrica", "Una gaseosa", "Té negro bien cargado"], e: "La vitamina C (limón, naranja, mandarina, morrón) ayuda a absorber el hierro de origen vegetal. El té, en cambio, lo dificulta." },
    { c: "fv", l: 3, q: "¿Por qué conviene que las verduras del plato sean de distintos colores?", o: ["Porque cada color aporta distintas vitaminas y antioxidantes", "Porque solo las verdes sirven", "Porque los colores son solo de adorno"], e: "Los colores indican distintos nutrientes y compuestos protectores: por eso conviene variar." },

    // Agua y bebidas
    { c: "ag", q: "¿Cuántos vasos de agua segura conviene tomar por día?", o: ["Unos 8 vasos", "Solo 1 vaso", "Solo cuando hay mucha sed"], e: "Se recomienda tomar alrededor de 8 vasos de agua segura por día, aunque no tengamos sed." },
    { c: "ag", q: "¿Cuál es la mejor bebida para calmar la sed?", o: ["El agua", "La gaseosa", "El jugo en polvo con azúcar"], e: "El agua es la mejor bebida para hidratarnos, sin azúcar agregada." },
    { c: "ag", q: "¿Cuál de estas aguas es segura para tomar?", o: ["Agua de la canilla de red, o agua hervida", "Agua de un charco", "Agua de una acequia"], e: "El agua segura es la de la canilla de red, o la que se hirvió antes de tomarla." },
    { c: "ag", q: "¿Cada cuánto conviene tomar gaseosas y jugos azucarados?", o: ["Solo de vez en cuando", "Todos los días con las comidas", "En lugar del agua"], e: "Las bebidas azucaradas conviene limitarlas y elegir agua en el día a día." },
    { c: "ag", q: "¿Cómo le podemos dar sabor al agua sin azúcar?", o: ["Con rodajas de limón, naranja o menta", "Con 4 cucharadas de azúcar", "Con jarabe de colores"], e: "Unas rodajas de fruta o hojas de menta dan sabor sin agregar azúcar." },
    { c: "ag", l: 2, q: "¿Cómo se potabiliza el agua con lavandina de uso doméstico?", o: ["2 gotas por litro y esperar 30 minutos", "Un vaso por balde, sin esperar", "Un chorro grande y tomarla enseguida"], e: "Por cada litro de agua se agregan 2 gotas de lavandina de uso doméstico (sin aroma ni aditivos) y se deja reposar 30 minutos." },
    { c: "ag", l: 2, q: "¿Qué tiene una lata de gaseosa común además de agua y gas?", o: ["Muchas cucharaditas de azúcar", "Vitaminas para crecer", "Nada más"], e: "Una lata puede tener el equivalente a entre 8 y 10 cucharaditas de azúcar. Por eso conviene dejarla para ocasiones especiales." },
    { c: "ag", l: 2, q: "¿Qué leyenda deben llevar las bebidas con cafeína, como las energizantes?", o: ["«Contiene cafeína. Evitar en niños/as»", "«Recomendada para chicos»", "No lleva ninguna leyenda"], e: "La Ley de Promoción de la Alimentación Saludable exige esa advertencia: la cafeína no es para niñas y niños." },
    { c: "ag", l: 2, q: "¿Quiénes necesitan prestar más atención a tomar suficiente agua?", o: ["Personas mayores, niños, embarazadas y quienes hacen actividad o pasan calor", "Solo los deportistas profesionales", "Nadie: el cuerpo no pierde agua"], e: "En el calor, con actividad, en la niñez, en el embarazo y en la vejez la sed puede avisar tarde: conviene tomar agua aunque no haya sed." },
    { c: "ag", l: 3, q: "Un producto dice «sin azúcar agregada» pero tiene la leyenda «Contiene edulcorantes». ¿Qué significa?", o: ["Está endulzado con edulcorantes y no se recomienda para niñas y niños", "Es el más saludable para chicos", "Tiene el doble de azúcar"], e: "Los edulcorantes reemplazan el azúcar pero mantienen el gusto muy dulce. La ley pide advertir que no se recomiendan en niños y niñas." },
    { c: "ag", l: 3, q: "Para un cumpleaños, ¿qué opción ayuda a bajar el azúcar total sin que sea aburrido?", o: ["Jarra de agua con frutas y hielo", "Gaseosa de dos litros para todos", "Jugo en polvo bien concentrado"], e: "El agua con rodajas de fruta es linda, económica y no agrega azúcar." },

    // Comidas saludables
    { c: "co", q: "¿Qué opción podemos elegir para una merienda?", o: ["Fruta y yogur natural", "Gaseosa y caramelos", "Solo golosinas"], e: "La fruta y el yogur son una merienda rica, económica y nutritiva." },
    { c: "co", q: "¿Cuál de estos alimentos es una legumbre, como los porotos?", o: ["Las lentejas", "La zanahoria", "La manzana"], e: "Lentejas, garbanzos y porotos son legumbres: llenan, hacen bien y son muy económicas." },
    { c: "co", q: "¿Qué alimentos conviene tomar todos los días para cuidar huesos y dientes?", o: ["Leche, yogur o queso", "Gaseosa", "Papas fritas de paquete"], e: "La leche, el yogur y el queso tienen calcio, que fortalece huesos y dientes. Conviene tomarlos todos los días." },
    { c: "co", q: "¿Qué alimento conviene comer más seguido?", o: ["Pescado", "Salchichas", "Fiambres"], e: "Conviene sumar pescado a la semana. Los fiambres y salchichas, mejor de vez en cuando." },
    { c: "co", q: "¿Con qué podemos darle sabor a las comidas en lugar de ponerles más sal?", o: ["Con orégano, perejil y otras hierbas", "Con más sal", "Con caldo en cubito"], e: "Las hierbas y especias dan sabor y ayudan a usar menos sal." },
    { c: "co", l: 2, q: "¿Cuánto tiempo conviene dar solo leche materna a un bebé?", o: ["Los primeros 6 meses", "Hasta los 2 meses", "Solo el primer mes"], e: "Hasta los 6 meses la leche materna es suficiente. Después se suman otros alimentos y se puede seguir amamantando hasta los 2 años o más." },
    { c: "co", l: 2, q: "¿Cuántas porciones de lácteos conviene tomar por día?", o: ["3 porciones (leche, yogur o queso)", "Ninguna", "10 porciones"], e: "Las guías recomiendan 3 porciones diarias de leche, yogur o queso, por su calcio." },
    { c: "co", l: 2, q: "¿Con qué conviene condimentar la ensalada?", o: ["Aceite crudo y limón o vinagre", "Mayonesa o aderezos en abundancia", "Manteca derretida"], e: "El aceite crudo, en poca cantidad, es una buena grasa para condimentar. Los aderezos industriales suman sal y grasa." },
    { c: "co", l: 2, q: "¿Cuántas veces por semana conviene comer pescado?", o: ["Dos veces o más", "Nunca", "Una vez al año"], e: "Las guías sugieren comer pescado dos veces por semana o más: aporta proteínas y grasas buenas para el corazón." },
    { c: "co", l: 3, q: "Lentejas con arroz: ¿por qué es una buena combinación?", o: ["Juntos aportan proteínas de buena calidad y son económicos", "Porque son del mismo color", "Porque se cocinan más rápido"], e: "Legumbres y cereales se complementan: juntos aportan proteínas de mejor calidad, y son muy económicos." },
    { c: "co", l: 3, q: "¿Qué cortes de carne conviene elegir con más frecuencia?", o: ["Los magros (nalga, cuadril, peceto) y sin grasa visible", "Los más gordos, porque rinden más", "Los embutidos"], e: "Conviene quitar la grasa visible y elegir cortes magros para cuidar el corazón." },

    // Compras y alimentos
    { c: "cm", q: "Cuando compramos un alimento envasado, ¿qué conviene mirar?", o: ["La fecha de vencimiento", "El color del envase", "El dibujo del paquete"], e: "La fecha de vencimiento nos dice hasta cuándo el alimento es seguro." },
    { c: "cm", q: "¿Qué alimentos conviene que sean la base de nuestras compras?", o: ["Frescos, como verduras, frutas, legumbres y huevos", "Golosinas y snacks", "Gaseosas"], e: "Los alimentos frescos y simples son la mejor base para comer bien y gastar menos." },
    { c: "cm", q: "¿Cómo podemos cuidar el bolsillo al comprar frutas y verduras?", o: ["Elegir las de estación", "Comprar siempre las más caras", "Comprar solo golosinas"], e: "Las frutas y verduras de estación rinden más y cuestan menos." },
    { c: "cm", q: "Un paquete tiene un sello negro que dice «EXCESO EN». ¿Qué significa?", o: ["Que tiene mucha azúcar, grasa o sal y conviene comerlo poco", "Que es más rico", "Que es especial para chicos"], e: "Esos sellos negros avisan cuando un alimento tiene demasiada azúcar, grasa o sal." },
    { c: "cm", q: "Si queremos algo rápido para comer entre horas, ¿qué conviene tener en casa?", o: ["Una fruta, un yogur o pan integral con queso", "Papas fritas de bolsa", "Golosinas"], e: "Tener opciones simples a mano ayuda a elegir mejor." },
    { c: "cm", l: 2, q: "En una lista de ingredientes, ¿qué significa que el azúcar aparezca primero?", o: ["Que es el ingrediente que más tiene el producto", "Que es el que menos tiene", "Que es el más saludable"], e: "Los ingredientes se ordenan de mayor a menor cantidad: el primero es el que más hay." },
    { c: "cm", l: 2, q: "El cartel «light» o «diet» en un producto, ¿garantiza que es saludable?", o: ["No: hay que mirar igual los sellos y los ingredientes", "Sí, siempre", "Sí, y se puede comer sin límite"], e: "«Light» solo indica que tiene menos de algún nutriente. Hay que mirar los sellos y la lista de ingredientes." },
    { c: "cm", l: 2, q: "Para cuidar el bolsillo y comer bien, ¿qué conviene?", o: ["Cocinar en casa con alimentos frescos y de estación", "Comprar siempre productos listos", "Comprar solo marcas famosas"], e: "Cocinar con alimentos simples y de estación rinde más y sale más barato." },
    { c: "cm", l: 3, q: "¿Cuántos sellos negros de advertencia existen en los envases?", o: ["Cinco: azúcares, sodio, grasas saturadas, grasas totales y calorías", "Dos: azúcar y sal", "Ninguno, es voluntario"], e: "Los sellos son cinco: «exceso en azúcares», «sodio», «grasas saturadas», «grasas totales» y «calorías»." },
    { c: "cm", l: 3, q: "¿Qué prohíbe la ley para los productos que tienen sellos negros?", o: ["Usar personajes infantiles y dirigir publicidad a niños y niñas", "Venderlos en el kiosco", "Nada, es solo informativo"], e: "La Ley 27.642 impide que los productos con sellos usen personajes, regalos o publicidad dirigida a la niñez." },
    { c: "cm", l: 3, q: "Dos paquetes de galletitas: uno tiene 3 sellos y otro, 1. ¿Qué conviene?", o: ["El de menos sellos, y mejor aún una opción sin sellos", "El de más sellos, porque es más barato", "Es lo mismo"], e: "Cuantos menos sellos, mejor. Y lo ideal es elegir alimentos frescos o con pocos ingredientes." },

    // Higiene y cuidados
    { c: "hi", q: "¿Cuándo tenemos que lavarnos las manos?", o: ["Antes de cocinar y antes de comer", "Solo al terminar el día", "Solo si se ven muy sucias"], e: "Lavarse las manos con agua y jabón antes de cocinar y comer evita enfermedades." },
    { c: "hi", q: "¿Dónde guardamos la leche, el yogur y la carne?", o: ["En la heladera", "Sobre la mesada", "Al sol, en el patio"], e: "Los alimentos que se estropean fácil deben guardarse en la heladera." },
    { c: "hi", q: "¿Qué hacemos con las frutas y verduras antes de comerlas?", o: ["Las lavamos con agua segura", "Las comemos sin lavar", "Les pasamos un trapo seco"], e: "Lavar las frutas y verduras con agua segura saca la tierra y los microbios." },
    { c: "hi", q: "Usamos una tabla para cortar carne cruda. ¿Qué hacemos antes de cortar verduras?", o: ["La lavamos bien con agua y detergente", "Seguimos usándola igual", "Le pasamos un trapo seco"], e: "Lavar tabla y cuchillo evita que los microbios de la carne cruda pasen a otros alimentos." },
    { c: "hi", q: "¿Cómo tiene que estar el pollo o la hamburguesa para comerlos?", o: ["Bien cocidos, sin parte rosada por dentro", "Dorados por fuera y crudos adentro", "Poco hechos"], e: "El pollo y la carne picada deben cocinarse bien por dentro para ser seguros." },
    { c: "hi", l: 2, q: "¿Cuánto tiempo pueden estar fuera de la heladera los alimentos que se echan a perder?", o: ["Como máximo 2 horas (menos si hace mucho calor)", "Todo el día", "Hasta 24 horas"], e: "A temperatura ambiente los microbios se multiplican rápido. Hay que guardar los alimentos en la heladera dentro de las 2 horas." },
    { c: "hi", l: 2, q: "¿Cuál es la temperatura recomendada para la heladera?", o: ["5 °C o menos", "15 °C", "20 °C"], e: "A 5 °C o menos los microbios crecen mucho más lento." },
    { c: "hi", l: 2, q: "¿Por qué separamos los alimentos crudos de los cocidos?", o: ["Para que los microbios de lo crudo no pasen a lo cocido", "Para que ocupen menos lugar", "Para que se enfríen antes"], e: "Se llama contaminación cruzada: los microbios de la carne cruda pueden pasar a alimentos que ya no se van a cocinar." },
    { c: "hi", l: 3, q: "¿Cuál es la forma más segura de descongelar carne?", o: ["En la heladera", "Sobre la mesada toda la noche", "Al sol"], e: "Descongelar en la heladera mantiene el alimento frío y seguro. Afuera, la parte de afuera se calienta mientras adentro sigue congelado." },
    { c: "hi", l: 3, q: "¿Por qué no se recomienda lavar el pollo crudo en la pileta?", o: ["Porque las gotitas esparcen microbios por la cocina", "Porque se le va el sabor", "Porque se pone duro"], e: "Al lavarlo salpica agua con microbios sobre mesada y utensilios. Alcanza con cocinarlo bien." },
    { c: "hi", l: 3, q: "El síndrome urémico hemolítico (SUH) se previene, entre otras cosas, con…", o: ["Carne bien cocida, agua segura y lácteos pasteurizados", "Tomar más gaseosas", "Evitar las verduras"], e: "El SUH puede venir de la bacteria E. coli. Se previene cocinando bien la carne picada, lavando frutas y verduras, usando agua segura y lácteos pasteurizados." },

    // Movimiento y hábitos
    { c: "mo", q: "¿Cuánto movimiento conviene hacer por día?", o: ["Al menos 30 minutos", "Ninguno", "Solo 5 minutos por semana"], e: "Con 30 minutos de movimiento por día cuidamos el corazón, los huesos y el ánimo." },
    { c: "mo", q: "¿Cuál de estas cosas cuenta como actividad física?", o: ["Caminar rápido, bailar o andar en bici", "Mirar televisión", "Dormir la siesta"], e: "Caminar, bailar y jugar también son actividad física. No hace falta ir a un gimnasio." },
    { c: "mo", q: "¿Cómo conviene comer?", o: ["Despacio y, si se puede, acompañado", "Rápido y mirando el celular", "De parado y con apuro"], e: "Comer con tiempo y en compañía ayuda a disfrutar y a darnos cuenta cuándo ya estamos llenos." },
    { c: "mo", q: "¿Qué conviene hacer con el salero?", o: ["Sacarlo de la mesa", "Ponerlo siempre en el centro", "Agregar sal antes de probar"], e: "Sin salero en la mesa usamos menos sal, y eso cuida el corazón." },
    { c: "mo", q: "¿Quiénes no deben tomar bebidas alcohólicas?", o: ["Niños, adolescentes y mujeres embarazadas", "Solo los abuelos", "Nadie, a todos les hace bien"], e: "Niños, adolescentes y embarazadas no deben tomar alcohol. En los adultos, siempre con responsabilidad." },
    { c: "mo", l: 2, q: "¿Cuánta sal conviene consumir como máximo por día?", o: ["Menos de 5 g, una cucharadita de té", "Una cucharada sopera", "Toda la que se quiera"], e: "Menos de 5 g por día, contando la sal de los alimentos industrializados y la que agregamos." },
    { c: "mo", l: 2, q: "¿Cuánta actividad física conviene que hagan niñas, niños y adolescentes por día?", o: ["Al menos 60 minutos", "10 minutos", "No hace falta"], e: "La OMS recomienda al menos 60 minutos diarios de actividad moderada a intensa en la niñez y adolescencia." },
    { c: "mo", l: 2, q: "Ante un antojo dulce entre comidas, ¿qué opción ayuda más?", o: ["Una fruta o un yogur natural", "Tres alfajores", "Una gaseosa"], e: "Tener fruta o yogur a mano ayuda a elegir mejor sin dejar de disfrutar." },
    { c: "mo", l: 3, q: "En personas adultas, ¿cuántos minutos por semana de actividad física moderada se recomiendan?", o: ["Al menos 150", "15", "Ninguno si el trabajo es sentado"], e: "Unos 150 minutos por semana (por ejemplo, 30 minutos, 5 días) ayudan a cuidar el corazón, los huesos y el ánimo." },
    { c: "mo", l: 3, q: "¿Cuáles de estos condimentos tienen mucho sodio y conviene usar poco?", o: ["Caldos y sopas en cubo", "Orégano", "Ajo y perejil"], e: "Los caldos y sopas en cubo tienen mucha sal. Las hierbas y especias dan sabor sin agregar sodio." },
    { c: "mo", l: 3, q: "¿Qué efecto tiene el exceso de sal en el cuerpo?", o: ["Aumenta el riesgo de hipertensión", "Fortalece los huesos", "Baja el colesterol"], e: "El exceso de sodio sube la presión arterial y daña el corazón y los riñones con el tiempo." }
  ];

  var CH = [
    { id: "fv5", title: "Cinco frutas y cinco verduras", say: "¡Hola, soy el Chef Comodín! A ver cuántas frutas y verduras conocés.",
      instr: "Decí en voz alta 5 frutas y 5 verduras distintas. El coordinador las va sumando.",
      win: "¡Muy bien! Frutas y verduras de distintos colores, todos los días, hacen bien.",
      lose: "¡Casi! Recordá: frutas y verduras, todos los días y de distintos colores." },
    { id: "memo", title: "Juego de memoria", say: "¡Llegó el Chef Comodín! ¿Tenés buena memoria?",
      instr: "Da vuelta las cartas de a dos y encontrá las 5 parejas de alimentos.",
      win: "¡Qué memoria! Y recordá: cuanta más variedad en el plato, mejor.",
      lose: "¡Casi! La memoria se entrena jugando. Y a comer variado todos los días." },
    { id: "plato", title: "Elegí los alimentos que hacen bien", say: "¡Soy el Chef Comodín! Ayudame a armar un plato saludable.",
      instr: "Tocá los 5 alimentos que conviene comer todos los días.",
      win: "¡Excelente! Frutas, verduras, huevo, pescado y leche son buenas opciones para todos los días.",
      lose: "¡Casi! Las frutas, las verduras, el huevo, el pescado y la leche son buenas opciones todos los días." }
  ];

  var FOODS = [
    { e: "🍎", n: "Manzana", g: 1 }, { e: "🥕", n: "Zanahoria", g: 1 }, { e: "🥦", n: "Brócoli", g: 1 },
    { e: "🐟", n: "Pescado", g: 1 }, { e: "🥛", n: "Leche", g: 1 },
    { e: "🥤", n: "Gaseosa", g: 0 }, { e: "🍬", n: "Caramelos", g: 0 }, { e: "🍩", n: "Donas", g: 0 }, { e: "🍟", n: "Papas fritas de bolsa", g: 0 }
  ];

  window.RULETA_DATA = { CATS: CATS, Q: Q, CH: CH, FOODS: FOODS, CH_SECS: 30 };
})();
