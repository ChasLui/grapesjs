import { CanvasSpotBuiltInTypes } from '../../canvas/model/CanvasSpot';
import Component from '../../dom_components/model/Component';
import EditorModel from '../../editor/model/Editor';
import { getPointerEvent } from '../dom';
import { BaseComponentNode } from './BaseComponentNode';
import Sorter from './Sorter';
import { SorterContainerContext, PositionOptions, SorterDragBehaviorOptions, SorterEventHandlers } from './types';

const targetSpotType = CanvasSpotBuiltInTypes.Target;

const spotTarget = {
  id: 'sorter-target',
  type: targetSpotType,
};

export default class ComponentSorter<NodeType extends BaseComponentNode> extends Sorter<Component, NodeType> {
  targetIsText: boolean = false;
  constructor({
    em,
    treeClass,
    containerContext,
    dragBehavior,
    positionOptions = {},
    eventHandlers = {},
  }: {
    em: EditorModel;
    treeClass: new (model: Component) => NodeType;
    containerContext: SorterContainerContext;
    dragBehavior: SorterDragBehaviorOptions;
    positionOptions?: PositionOptions;
    eventHandlers?: SorterEventHandlers<NodeType>;
  }) {
    super({
      em,
      treeClass,
      containerContext,
      positionOptions,
      dragBehavior,
      eventHandlers: {
        ...eventHandlers,
        onStartSort: (sourceNodes: NodeType[], containerElement?: HTMLElement) => {
          eventHandlers.onStartSort?.(sourceNodes, containerElement);
          this.onStartSort();
        },
        onDrop: (targetNode: NodeType | undefined, sourceNodes: NodeType[], index: number | undefined) => {
          eventHandlers.onDrop?.(targetNode, sourceNodes, index);
          this.onDrop(targetNode, sourceNodes, index);
        },
        onTargetChange: (oldTargetNode: NodeType | undefined, newTargetNode: NodeType | undefined) => {
          eventHandlers.onTargetChange?.(oldTargetNode, newTargetNode);
          this.onTargetChange(oldTargetNode, newTargetNode);
        },
        onMouseMove: (mouseEvent) => {
          eventHandlers.onMouseMove?.(mouseEvent);
          this.onMouseMove(mouseEvent);
        },
      },
    });
  }

  private onStartSort() {
    this.em.clearSelection();
    this.toggleSortCursor(true);
  }

  private onMouseMove = (mouseEvent: MouseEvent) => {
    const insertingTextableIntoText = this.targetIsText && this.sourceNodes?.some((node) => node.isTextable());
    if (insertingTextableIntoText) {
      this.updateTextViewCursorPosition(mouseEvent);
    }
  };

  /**
   * Handles the drop action by moving the source nodes to the target node.
   * Calls appropriate handlers based on whether the move was successful or not.
   * 
   * @param targetNode - The node where the source nodes will be dropped.
   * @param sourceNodes - The nodes being dropped.
   * @param index - The index at which to drop the source nodes.
   */
  private onDrop = (targetNode: NodeType | undefined, sourceNodes: NodeType[], index: number | undefined): void => {
    const at = typeof index === 'number' ? index : -1;
    if (targetNode && sourceNodes.length > 0) {
      const addedNodes = this.handleNodeAddition(targetNode, sourceNodes, at);
      if (addedNodes.length === 0) this.triggerNullOnEndMove(false)
    } else {
      this.triggerNullOnEndMove(true);
    }

    targetNode?.restNodeState();
    this.placeholder.hide();
  };

  /**
   * Handles the addition of multiple source nodes to the target node.
   * If the move is valid, adds the nodes at the specified index.
   * 
   * @param targetNode - The target node where source nodes will be added.
   * @param sourceNodes - The nodes being added.
   * @param index - The index at which to add the source nodes.
   * @returns The list of successfully added nodes.
   */
  private handleNodeAddition(targetNode: NodeType, sourceNodes: NodeType[], index: number): NodeType[] {
    return sourceNodes.reduce((addedNodes, sourceNode) => {
      if (this.canMoveNode(targetNode, sourceNode, index)) {
        const addedNode = this.moveNode(targetNode, sourceNode, index);
        if (addedNode) addedNodes.push(addedNode);
      }
      return addedNodes;
    }, [] as NodeType[]);
  }

  /**
   * Determines if a source node can be moved to the target node at the given index.
   * 
   * @param targetNode - The node where the source node will be moved.
   * @param sourceNode - The node being moved.
   * @param index - The index at which to move the source node.
   * @returns Whether the node can be moved.
   */
  private canMoveNode(targetNode: NodeType, sourceNode: NodeType, index: number): boolean {
    if (!targetNode.canMove(sourceNode, index)) return false;

    const parent = sourceNode.getParent();
    const initialSourceIndex = parent ? parent.indexOfChild(sourceNode) : -1;
    if (parent?.model.cid === targetNode.model.cid && initialSourceIndex < index) {
      index--; // Adjust index if moving within the same collection and after the initial position
    }

    const isSameCollection = parent?.model.cid === targetNode.model.cid;
    const isSameIndex = initialSourceIndex === index;
    const insertingTextableIntoText = this.targetIsText && sourceNode.isTextable();

    return !(isSameCollection && isSameIndex && !insertingTextableIntoText);
  }

  /**
   * Moves a source node to the target node at the specified index, handling edge cases.
   * 
   * @param targetNode - The node where the source node will be moved.
   * @param sourceNode - The node being moved.
   * @param index - The index at which to move the source node.
   * @returns The node that was moved and added, or null if it couldn't be moved.
   */
  private moveNode(targetNode: NodeType, sourceNode: NodeType, index: number): NodeType {
    const parent = sourceNode.getParent();
    if (parent) {
      const initialSourceIndex = parent.indexOfChild(sourceNode);
      parent.removeChildAt(initialSourceIndex, { temporary: true });

      if (parent.model.cid === targetNode.model.cid && initialSourceIndex < index) {
        index--; // Adjust index if moving within the same collection and after the initial position
      }
    }

    const addedNode = targetNode.addChildAt(sourceNode, index, { action: 'move-component' }) as NodeType;
    this.triggerEndMoveEvent(addedNode);

    return addedNode;
  }

  /**
   * Triggers the end move event for a node that was added to the target.
   * 
   * @param addedNode - The node that was moved and added to the target.
   */
  private triggerEndMoveEvent(addedNode: NodeType): void {
    this.eventHandlers.legacyOnEndMove?.(addedNode.model, this, {
      target: addedNode.model,
      // @ts-ignore
      parent: addedNode.model && addedNode.model.parent(),
      // @ts-ignore
      index: addedNode.model && addedNode.model.index(),
    });
  }

  /**
   * Finalize the move by removing any helpers and selecting the target model.
   *
   * @private
   */
  protected finalizeMove(): void {
    this.em?.Canvas.removeSpots(spotTarget);
    this.sourceNodes?.forEach((node) => node.restNodeState());
    super.finalizeMove();
  }

  private onTargetChange = (oldTargetNode: NodeType | undefined, newTargetNode: NodeType | undefined) => {
    oldTargetNode?.restNodeState();
    if (!newTargetNode) {
      return;
    }
    newTargetNode?.setSelectedParentState();
    this.targetIsText = newTargetNode.isTextNode();
    const insertingTextableIntoText = this.targetIsText && this.sourceNodes?.some((node) => node.isTextable());
    if (insertingTextableIntoText) {
      newTargetNode.setContentEditable(true);
      this.placeholder.hide();
    } else {
      this.placeholder.show();
    }
  };

  private updateTextViewCursorPosition(e: any) {
    const { em } = this;
    if (!em) return;
    const Canvas = em.Canvas;
    const targetDoc = Canvas.getDocument();
    let range = null;

    const poiner = getPointerEvent(e);

    // @ts-ignore
    if (targetDoc.caretPositionFromPoint) {
      // New standard method
      // @ts-ignore
      const caretPosition = targetDoc.caretPositionFromPoint(poiner.clientX, poiner.clientY);
      if (caretPosition) {
        range = targetDoc.createRange();
        range.setStart(caretPosition.offsetNode, caretPosition.offset);
      }
    } else if (targetDoc.caretRangeFromPoint) {
      // Fallback for older browsers
      range = targetDoc.caretRangeFromPoint(poiner.clientX, poiner.clientY);
    } else if (e.rangeParent) {
      // Firefox fallback
      range = targetDoc.createRange();
      range.setStart(e.rangeParent, e.rangeOffset);
    }

    const sel = Canvas.getWindow().getSelection();
    Canvas.getFrameEl().focus();
    sel?.removeAllRanges();
    range && sel?.addRange(range);
  }

  /**
   * Toggle cursor while sorting
   * @param {Boolean} active
   */
  private toggleSortCursor(active?: boolean) {
    const { em } = this;
    const cv = em?.Canvas;

    // Avoid updating body className as it causes a huge repaint
    // Noticeable with "fast" drag of blocks
    cv && (active ? cv.startAutoscroll() : cv.stopAutoscroll());
  }
}
