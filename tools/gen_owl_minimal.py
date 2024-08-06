"""
---------------
gen_owl_minimal.py
---------------

Generate a serialized graph of triples from a LinkML-turned-OWL schema,
where the triples only include those with predicate == rdfs:subClassOf

"""

from argparse import ArgumentParser, RawDescriptionHelpFormatter
from pathlib import Path
from rdflib import Graph, term, BNode
from rdflib.namespace import RDF, RDFS
import subprocess
import sys


def get_owl(schema_path):
    """"""
    args = ['gen-owl', str(schema_path)]
    return run_subprocess(args)


def run_subprocess(args):
    return subprocess.run(args, capture_output=True, text=True).stdout


def get_class_hierarchy(schema_path):
    # Generate OWL from the schema
    owl = get_owl(schema_path)
    # Add all triples into the graph
    g = Graph()
    g.parse(data=owl)
    # Add wanted triples to new graph
    new_g = Graph()
    for s, p, o in g.triples((None,  RDFS.subClassOf, None)):
        if not isinstance(s, BNode) and not isinstance(o, BNode):
            new_g.add((s, p, o))

    # serialize
    new_g.serialize(destination=output_path)
    print(f"Graph written to: {str(output_path)}")


if __name__ == "__main__":
    parser = ArgumentParser(epilog=__doc__,
                            formatter_class=RawDescriptionHelpFormatter)
    parser.add_argument(
        "schema",
        type=str,
        help="Path to the LinkML schema with UI annotations (YAML)",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="""Path to the output 'ttl' file containing all triples.
              If not supplied, the output will be written to 'graph_owl.ttl'
              in the current working directory.""",
    )
    args = parser.parse_args()

    # 0. Establish some paths
    fp = Path(__file__)
    tools_dir = fp.parent.resolve()
    schema_path = Path(args.schema).resolve()
    curdir = Path.cwd()
    if args.output:
        output_path = Path(args.output).resolve()
    else:
        output_path = curdir / 'graph_owl.ttl'
    
    get_class_hierarchy(schema_path=schema_path)
    