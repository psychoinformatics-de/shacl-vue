"""
---------------
gen_shacl_ui.py
---------------

Generate a serialized graph of triples from a LinkML-turned-SHACL schema
and a separately specified list of property groups.

This script takes a LinkML schema with UI annotations and a data file
containing a list property groups as input arguments and then:
- validates the data file according to the LinkML schema located in this 
  repository at 'tools/property_group_schema.yaml'
- validates the UI-annotated schema (TODO)
- converts the property groups in the data file to RDF
- exports the UI-annotated schema to SHACL
- combines the property groups and schema exports into a single graph
- serializes the complete graph to a 'ttl' file

This allows a user to design the categorical structure of a user interface
via an easy-to-edit YAML file, and end up with a single-file graph that can
be used as input to the 'shacl-vue' user interface.

"""

from argparse import ArgumentParser, RawDescriptionHelpFormatter
from linkml.validator import validate_file
from pathlib import Path
from rdflib import Graph, term
import subprocess
import sys


def get_shacl(schema_path):
    """"""
    args = ['gen-shacl', '--include-annotations', str(schema_path)]
    return run_subprocess(args)


def get_groups_rdf(data_path, schema_path):
    """"""
    args = ['linkml-convert', '-s', str(schema_path), '-t', 'rdf', str(data_path)]
    return run_subprocess(args)


def run_subprocess(args):
    return subprocess.run(args, capture_output=True, text=True).stdout


def validate_inputs(group_data_path, group_schema_path, schema_path):
    """"""
    # Validate data file
    report = validate_file(group_data_path, group_schema_path)
    if not report.results:
        print('Property group data: valid!')
    else:
        for result in report.results:
            print(result.message)
        sys.exit()
    # TODO: also validate the annotated schema!


def combine_graphs(group_data_path, group_schema_path, schema_path):
    # a. Convert property group data file to RDF
    groups_rdf = get_groups_rdf(group_data_path, group_schema_path)
    # b. Generate SHACL from the annotated schema
    shacl = get_shacl(schema_path)
    # c. Combine all triples into the same graph, remove unnecessary triples, and serialize
    g = Graph()
    g.parse(data=groups_rdf)
    g.parse(data=shacl)
    g.remove((None, None, term.URIRef('https://concepts.datalad.org/s/pgui/unreleased/Container')))
    g.remove((None, term.URIRef('https://concepts.datalad.org/s/pgui/unreleased/property_groups'), None))
    g.serialize(destination=output_path)
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
        "property_groups",
        type=str,
        help="Path to the YAML data file containing 'PropertyGroup's",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="""Path to the output 'ttl' file containing all triples.
              If not supplied, the output will be written to 'graph.ttl'
              in the current working directory.""",
    )
    args = parser.parse_args()

    # 0. Establish some paths
    fp = Path(__file__)
    tools_dir = fp.parent.resolve()
    prop_group_schema_path = tools_dir / 'property_group_schema.yaml'
    prop_group_data_path = Path(args.property_groups).resolve()
    schema_path = Path(args.schema).resolve()
    curdir = Path.cwd()
    if args.output:
        output_path = Path(args.output).resolve()
    else:
        output_path = curdir / 'graph.ttl'
    
    # 1. First validate group data and schema
    validate_inputs(
        group_data_path=prop_group_data_path,
        group_schema_path=prop_group_schema_path,
        schema_path=schema_path)
    
    # 2. Combine triples from data file and annotated schema
    combine_graphs(
        group_data_path=prop_group_data_path,
        group_schema_path=prop_group_schema_path,
        schema_path=schema_path)
    