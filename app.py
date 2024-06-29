from flask import Flask, render_template, request, abort


app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/audio-compression")
def audioCompression_menu():
    return render_template("audiocompress.html")

@app.route("/image-compression", methods=['POST'])
def imageCompression_menu():
    from ac_img import arithCompress
    arithCompress()
    
    from hc_img import main
    main()
    return render_template("imagecompress.html")

@app.route("/video-compression")
def videoCompression_menu():
    return render_template("videocompress.html")

if __name__ == "__main__":
    app.run(debug=True)