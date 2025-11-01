import { prisma } from '@/lib/db'
import { ModuleType } from '@prisma/client'

export interface ReadingModuleDataInput {
  part1Content?: string
  part2Content?: string
  part3Content?: string
  part1Passage?: string
  part2Passage?: string
  part3Passage?: string
  part1Instructions?: string
  part2Instructions?: string
  part3Instructions?: string
}

export interface ListeningModuleDataInput {
  audioUrl?: string
  audioPublicId?: string
  audioDuration?: number
  part1Content?: string
  part2Content?: string
  part3Content?: string
  part1Instructions?: string
  part2Instructions?: string
  part3Instructions?: string
  part1AudioStart?: number
  part1AudioEnd?: number
  part2AudioStart?: number
  part2AudioEnd?: number
  part3AudioStart?: number
  part3AudioEnd?: number
}

export class ModuleDataService {
  /**
   * Create or update reading module data
   */
  static async createOrUpdateReadingData(moduleId: string, data: ReadingModuleDataInput) {
    const existingData = await prisma.readingModuleData.findUnique({
      where: { moduleId }
    })

    if (existingData) {
      return await prisma.readingModuleData.update({
        where: { moduleId },
        data: {
          part1Content: data.part1Content || null,
          part2Content: data.part2Content || null,
          part3Content: data.part3Content || null,
          part1Passage: data.part1Passage || null,
          part2Passage: data.part2Passage || null,
          part3Passage: data.part3Passage || null,
          part1Instructions: data.part1Instructions || null,
          part2Instructions: data.part2Instructions || null,
          part3Instructions: data.part3Instructions || null
        }
      })
    } else {
      return await prisma.readingModuleData.create({
        data: {
          moduleId,
          part1Content: data.part1Content || null,
          part2Content: data.part2Content || null,
          part3Content: data.part3Content || null,
          part1Passage: data.part1Passage || null,
          part2Passage: data.part2Passage || null,
          part3Passage: data.part3Passage || null,
          part1Instructions: data.part1Instructions || null,
          part2Instructions: data.part2Instructions || null,
          part3Instructions: data.part3Instructions || null
        }
      })
    }
  }

  /**
   * Create or update listening module data
   */
  static async createOrUpdateListeningData(moduleId: string, data: ListeningModuleDataInput) {
    const existingData = await prisma.listeningModuleData.findUnique({
      where: { moduleId }
    })

    if (existingData) {
      return await prisma.listeningModuleData.update({
        where: { moduleId },
        data: {
          audioUrl: data.audioUrl || null,
          audioPublicId: data.audioPublicId || null,
          audioDuration: data.audioDuration || null,
          part1Content: data.part1Content || null,
          part2Content: data.part2Content || null,
          part3Content: data.part3Content || null,
          part1Instructions: data.part1Instructions || null,
          part2Instructions: data.part2Instructions || null,
          part3Instructions: data.part3Instructions || null,
          part1AudioStart: data.part1AudioStart || null,
          part1AudioEnd: data.part1AudioEnd || null,
          part2AudioStart: data.part2AudioStart || null,
          part2AudioEnd: data.part2AudioEnd || null,
          part3AudioStart: data.part3AudioStart || null,
          part3AudioEnd: data.part3AudioEnd || null
        }
      })
    } else {
      return await prisma.listeningModuleData.create({
        data: {
          moduleId,
          audioUrl: data.audioUrl || null,
          audioPublicId: data.audioPublicId || null,
          audioDuration: data.audioDuration || null,
          part1Content: data.part1Content || null,
          part2Content: data.part2Content || null,
          part3Content: data.part3Content || null,
          part1Instructions: data.part1Instructions || null,
          part2Instructions: data.part2Instructions || null,
          part3Instructions: data.part3Instructions || null,
          part1AudioStart: data.part1AudioStart || null,
          part1AudioEnd: data.part1AudioEnd || null,
          part2AudioStart: data.part2AudioStart || null,
          part2AudioEnd: data.part2AudioEnd || null,
          part3AudioStart: data.part3AudioStart || null,
          part3AudioEnd: data.part3AudioEnd || null
        }
      })
    }
  }

  /**
   * Get reading module data by module ID
   */
  static async getReadingData(moduleId: string) {
    return await prisma.readingModuleData.findUnique({
      where: { moduleId },
      include: {
        module: {
          include: {
            questions: {
              include: {
                questionBank: true
              }
            }
          }
        }
      }
    })
  }

  /**
   * Get listening module data by module ID
   */
  static async getListeningData(moduleId: string) {
    return await prisma.listeningModuleData.findUnique({
      where: { moduleId },
      include: {
        module: {
          include: {
            questions: {
              include: {
                questionBank: true
              }
            }
          }
        }
      }
    })
  }

  /**
   * Delete reading module data
   */
  static async deleteReadingData(moduleId: string) {
    return await prisma.readingModuleData.delete({
      where: { moduleId }
    })
  }

  /**
   * Delete listening module data
   */
  static async deleteListeningData(moduleId: string) {
    return await prisma.listeningModuleData.delete({
      where: { moduleId }
    })
  }

  /**
   * Get module data based on module type
   */
  static async getModuleData(moduleId: string, moduleType: ModuleType) {
    if (moduleType === ModuleType.READING) {
      return await this.getReadingData(moduleId)
    } else if (moduleType === ModuleType.LISTENING) {
      return await this.getListeningData(moduleId)
    }
    return null
  }

  /**
   * Create or update module data based on module type
   */
  static async createOrUpdateModuleData(
    moduleId: string, 
    moduleType: ModuleType, 
    data: ReadingModuleDataInput | ListeningModuleDataInput
  ) {
    if (moduleType === ModuleType.READING) {
      return await this.createOrUpdateReadingData(moduleId, data as ReadingModuleDataInput)
    } else if (moduleType === ModuleType.LISTENING) {
      return await this.createOrUpdateListeningData(moduleId, data as ListeningModuleDataInput)
    }
    return null
  }

  /**
   * Delete module data based on module type
   */
  static async deleteModuleData(moduleId: string, moduleType: ModuleType) {
    if (moduleType === ModuleType.READING) {
      return await this.deleteReadingData(moduleId)
    } else if (moduleType === ModuleType.LISTENING) {
      return await this.deleteListeningData(moduleId)
    }
    return null
  }
}
