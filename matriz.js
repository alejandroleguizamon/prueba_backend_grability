function ProcessEntry(inputtext) {
    var est = 0;
    Input.getInput(inputtext);

    Message.Show('Espere un momento. Se estan validando la sintaxis...', 1);
    try {
        Input.Validate();
    }
    catch(err) {
        Error.setError(err);
        Message.Show("Linea " + Input.lineindex + ": " + Error.getMessageText(), 2);
        return;
    }
    Message.Show('Espere un momento. Se esta procesando la matriz...', 1);
    try {
        Input.result = '';
        Input.ProcessCases();
        document.miniform['salida'].value = Input.result;
        Message.Show('Listo!', 0);
    }
    catch(err) {
        Error.setError(err);
        Message.Show(Error.getMessageText(), 2);
    }
}

var Message = {
  Show: function(ptext, type) {
      console.log('<<MENSAJE>> ' + ptext);
      msj = document.getElementById('mensaje');
      msj.innerHTML = ptext;
      switch(type) {
          case 0:msj.className = "ok"; break;
          case 1:msj.className = "ok2";break;
          case 2:msj.className = "ok3";break;
      }
  }
}

var Error = {
    status: 0,
    text: "",
    type: "",

    setError: function(errcode) {
        this.status = errcode;
        switch (parseInt(errcode / 10)) {
            case 0: this.type = "";break;
            case -1:this.type = "ERROR DE SINTAXIS";break;
            case -2:this.type = "ERROR DE LINEA";break;
            case -3:this.type = "ERROR DE RANGO";break;
            case -4:this.type = "ERROR DE INDICE"; break;
            default:this.type = "ERROR GENERICO"; break;
        }
        switch (errcode) {
            case 0:this.text = "";break;
            case -11:this.text = "Numero de casos no valido";break;
            case -12:this.text = "Dimension de matriz y/o numero de operaciones no valido";break;
            case -13:this.text = "Sintaxis de operacion de actualizacion no valida";break;
            case -14:this.text = "Sintaxis de operacion de consulta no valida";break;
            case -15:this.text = "Sintaxis de operacion no permitida";break;
            case -31:this.text = "Numero de casos no permitido. Se permiten de 1 a " + Input.MAXCASES; break;
            case -32:this.text = "Dimension de la matriz no permitido. Se permiten de 1 a " + Input.MAXSIZE; break;
            case -33:this.text = "Numero de operaciones no permitido. Se permiten de 1 a " + Input.MAXOPS; break;
            case -34:this.text = "Valor de parametro fuera del rango permitido"; break;
            case -41:this.text = "Valor de indice final menor que el inicial"; break;
            case -42:this.text = "Valor de indice fuera de los limites"; break;
            default:this.text = "Error desconocido";break;
        }
    },

    getMessageText: function() {
        console.log(this.type)
        return (this.type + " " + this.status + " (" + this.text + ")");
    }
}

var currentLine = {
    text: '',
    words: {},

    load: function(textline) {
        this.text = textline;
        this.words = textline.split(' ');
    },

  ValidateSyntax: function(type) {
      var pattern = /^\d+$/;
      switch (type) {
          case 1:pattern = /^\d+$/;break;
          case 2:pattern = /^\d+\s\d+$/;break;
          case 3:
              switch (this.words[0]) {
                  case 'UPDATE':pattern = /UPDATE\s\d+\s\d+\s\d+\s-?\d+$/;break;
                  case 'QUERY':pattern = /QUERY\s\d+\s\d+\s\d+\s\d+\s\d+\s\d+$/;break;
                  default: throw -15;
              }
      }
      var Reg = new RegExp(pattern);
      console.log('RegEx: ' + this.text);
      if (!Reg.test(this.text)) {
          throw (-10 - type);
      }
  }
}

var Matrix = {
  MAXVALUE: 10e9,

  size: 1,
  content: {},
  sum: 0,

  Resize: function(psize) {
      var x = 0;
      var y = 0;
      var z = 0;
      this.size = psize;
      for (x=0; x<this.size; x++) {
        this.content[x] = new Array();
        for(y=0; y<this.size; y++) {
            this.content[x][y] = new Array(this.size);
            for (z=0; z<this.size; z++)
                this.content[x][y][z] = 0;
        }
     }
  },

  UpdateBlock: function(px, py, pz, W) {
      px = this.ValidateIndex(px);
      py = this.ValidateIndex(py);
      pz = this.ValidateIndex(pz);
      if ((W < -this.MAXVALUE) || (W > this.MAXVALUE))
          throw -34;
      this.content[px][py][pz] = W;
  },

  Query: function(x1, y1, z1, x2, y2, z2) {
      x1 = this.ValidateIndex(x1);
      y1 = this.ValidateIndex(y1);
      z1 = this.ValidateIndex(z1);
      x2 = this.ValidateIndex(x2);
      y2 = this.ValidateIndex(y2);
      z2 = this.ValidateIndex(z2);
      if ((x1 > x2) || (y1 > y2) || (z1 > z2)) {
          throw -41;
      }
      var ix = 0;
      var iy = 0;
      var iz = 0;
      this.sum = 0;
      for (ix=x1; ix<=x2; ix++) {
          for (iy=y1; iy<=y2; iy++) {
              for (iz=z1; iz<=z2; iz++)
                  this.sum += parseInt(this.content[ix][iy][iz]);
          }
      }
      return this.sum;
  },

  ValidateIndex: function(parameter) {
      parameter--;//para que el indice apunte de 0 a N-1, en vez de 1 a N
      if ((0 > parameter) || (parameter >= this.size)) {
          throw -42;
      }
      return parameter;
  }
}

var Input = {
  MAXCASES: 50,
  MAXSIZE: 100,
  MAXOPS: 1000,

  lines: {},
  lineindex: 0,
  numcases: 0,
  size: 0,
  numops: 0,
  result: "",

  getInput: function (inputtext) {
      this.lines = inputtext.split('\n');
      console.clear();
  },

  nextLine: function() {
    if (this.lineindex >= this.lines.length) {
        throw -21;
    }
    return (this.lines[this.lineindex++]);
  },

  Validate: function() {
      var words = '';
/* validacion de linea 1: numero de casos */
      this.lineindex = 0;
      currentLine.load(this.nextLine());
      currentLine.ValidateSyntax(1);
      this.setCases(currentLine.text);

/* validacion de linea 2: numero de operaciones x caso */
      for (var icase=0; icase < this.numcases; icase++) {
        currentLine.load(this.nextLine());
        currentLine.ValidateSyntax(2);
        this.setSize(currentLine.words[0]);
        this.setOps(currentLine.words[1]);

/* validacion de lineas de operaciones */
        for (var iop=0; iop < this.numops; iop++) {
          currentLine.load(this.nextLine());
          currentLine.ValidateSyntax(3);
        }
      }
      this.lineindex = 1;
      return 0;
  },

  ProcessCases: function() {
      var queryResult = "";

      for (var icase=0; icase<this.numcases; icase++) {
        currentLine.load(this.nextLine());
        this.setSize(currentLine.words[0]);
        this.setOps(currentLine.words[1]);
        Matrix.Resize(this.size);

        for (var iop=0; iop<this.numops; iop++) {
          currentLine.load(this.nextLine());
          switch (currentLine.words[0]) {
              case 'UPDATE':
                  Matrix.UpdateBlock(currentLine.words[1], currentLine.words[2],
                    currentLine.words[3], currentLine.words[4]);
                  break;
              case 'QUERY':
                  queryResult = Matrix.Query(
                    currentLine.words[1], currentLine.words[2],
                    currentLine.words[3], currentLine.words[4],
                    currentLine.words[5], currentLine.words[6]);
                  this.result = this.result.concat(queryResult);
                  this.result = this.result.concat('\n');
                  break;
              default:
          }
        }
      }
  },

  setCases: function(value) {
      this.numcases = parseInt(value);
      if (this.numcases<1 || this.numcases>this.MAXCASES) {
          throw -31;
      }
  },

  setSize: function(value) {
      this.size = parseInt(value);
      if (this.size<1 || this.size>this.MAXSIZE) {
          throw -32;
      }
  },

  setOps: function(value) {
      this.numops = parseInt(value);
      if (this.numops<1 || this.numops>this.MAXOPS) {
          throw -33;
      }
  }
}