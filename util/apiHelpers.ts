import { IEmployee, IJobOffer, IProductOffer } from '@/models/Company';
import { ECVote } from '@/models/Election';
import { IRegion } from '@/models/Region';
import { UserActions } from '@/util/actions';

/* Interfaces */

export interface ILocationInfo {
  region_name: string,
  owner_id: number,
  owner_name: string,
  owner_flag: string,
}

export interface ICEOInfo {
  ceo_id: number,
  ceo_name: string,
  ceo_image: string,
}

export interface IItem {
  item_id: number,
  quantity: number,
}

export interface IJobMarketOffer extends IJobOffer {
  company: {
    id: number,
    image: string,
    name: string,
    type: number,
    ceo: number,
  }
}

export interface IGoodsMarketOffer extends IProductOffer {
  company: {
    id: number,
    image: string,
    name: string,
    type: number,
    ceo: number,
  }
}

export interface IEmployeeInfo extends IEmployee {
  name: string,
  image: string,
}

export interface IRegionNode {
  _id: IRegion['_id'],
  neighbors: IRegion['neighbors'],
  distance: number,
  visited: boolean,
  previous: IRegionNode | null,
  borders?: IRegion['borders']
}

/* Functions */

export function jsonify(data: any) {
  return JSON.parse(JSON.stringify(data));
}

export function buildLevelUpAlert(level: number) {
  return {
    read: false,
    type: UserActions.LEVEL_UP,
    message: `Congrats! You have leveled up to level ${level} and received 5 gold`,
    timestamp: new Date(Date.now()),
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export const findVote = (vote: number | ECVote, user_id: number) => {
  if (typeof vote === 'number') {
    return vote === user_id
  } else {
    return (vote as ECVote)?.tally.includes(user_id);
  }
}

export function getDistance(regions: IRegion[], src: number, dest: number) {
  let nodes: IRegionNode[] = createNodes(regions);
  let _visited: IRegionNode[] = dijkstras(nodes, nodes[src], nodes[dest]);
  let shortestPath: IRegionNode[] = getShortestPath(nodes[dest]);

  const distance: number = shortestPath.length - 1;
  const cost: number = roundMoney(distance);

  return {
    from: regions[src],
    to: regions[dest],
    path: shortestPath,
    distance,
    cost,
  };
}

function createNodes(regions: IRegion[]): IRegionNode[] {
  let nodes: IRegionNode[] = [];
  for (let region of regions) {
    nodes.push({
      _id: region._id,
      neighbors: region.neighbors,
      distance: Infinity,
      visited: false,
      previous: null,
      borders: undefined,
    });
  }

  return nodes;
}

function dijkstras(nodes: IRegionNode[], srcNode: IRegionNode, destNode: IRegionNode): IRegionNode[] {
  let visited: IRegionNode[] = [];
  srcNode.distance = 0;
  let unvisited: IRegionNode[] = getAllNodes(nodes);
  let shortestDistance: number = Infinity;

  while (!!unvisited.length) {
    sortNodesByDistance(unvisited);
    let closest: IRegionNode = getClosestNode(unvisited, destNode);

    if (closest.distance === Infinity)
      return visited;
    else if (closest.distance > shortestDistance)
      continue;
    else if (closest.distance === shortestDistance && closest._id === destNode._id)
      return visited;

    if (Array.isArray(closest.neighbors) && closest.neighbors.includes(destNode._id)) {
      destNode.distance = closest.distance + 1;
      destNode.previous = closest;
      shortestDistance = destNode.distance;
    } else if (!Array.isArray(closest.neighbors)) {
      console.log('Node neighbors field is not an array:', closest);
    }

    closest.visited = true;
    visited.push(closest);

    if (closest._id === destNode._id)
      shortestDistance = closest.distance;

    updateNeighbors(closest, nodes, unvisited);
  }

  return visited;
}

function getAllNodes(nodes: IRegionNode[]): IRegionNode[] {
  let node_list: IRegionNode[] = [];

  for (const node of nodes) {
    node_list.push(node);
  }

  return node_list;
}

function sortNodesByDistance(nodes: IRegionNode[]) {
  nodes.sort((a, b) => a.distance - b.distance);
}

function getClosestNode(nodes: IRegionNode[], destNode: IRegionNode) {
  let distance: number = nodes[0].distance;

  if (destNode.distance === distance)
    return destNode;
  else
    return nodes.shift();
}

function updateNeighbors(node: IRegionNode, nodes: IRegionNode[], unvisited: IRegionNode[]) {
  let neighbors: IRegionNode[] = getNeighborNodes(node, nodes, unvisited);

  for (let neighbor of neighbors) {
    if (neighbor.distance > node.distance + 1) {
      neighbor.distance = node.distance + 1;
      neighbor.previous = node;
    }
  }
}

function getNeighborNodes(node: IRegionNode, nodes: IRegionNode[], unvisited: IRegionNode[]): IRegionNode[] {
  let neighbors: IRegionNode[] = [];

  for (let [i, _neighbor] of nodes.entries()) {
    if (nodes[i-1]) {
      let neighborNode = nodes[i-1];
      if (neighborNode.visited && neighborNode.distance > node.distance + 1) {
        neighborNode.visited = false;
        unvisited.push(neighborNode);
      }
      neighbors.push(neighborNode);
    }
  }

  return neighbors.filter(n => !n.visited);
}

function getShortestPath(destNode: IRegionNode): IRegionNode[] {
  let shortestPath: IRegionNode[] = [];
  let currNode: IRegionNode = destNode;

  while (currNode !== null) {
    shortestPath.unshift(currNode);
    currNode = currNode.previous;
  }

  return shortestPath;
}