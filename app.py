from flask import Flask, render_template, request
import json
from scheduler import process_then_run

app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    return render_template('index.html')
    
@app.route("/submit", methods=["POST"])
def submit():
    """ 
    Dicts with the hours and distances should be accompanied with the request.
    
    Normalize that data and pass it to the algorithms. Render the results page with the results from the algorithms.
    """
    json = request.get_json()
    ids = json['ids']
    hours = json['hours']
    distances = json['distances']
    deps = json['dependencies']
    process_then_run(ids, hours, distances, deps)
    return "GOOD"

if __name__ == '__main__':
    app.run(debug = True, host='0.0.0.0', port=5000)


